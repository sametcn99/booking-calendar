import { AppDataSource } from "../db/data-source";
import { t } from "../i18n";
import { MailService } from "../mail/MailService";
import { AppointmentRepository } from "../repositories/AppointmentRepository";
import { BookingLinkRepository } from "../repositories/BookingLinkRepository";
import { SettingsRepository } from "../repositories/SettingsRepository";
import { SlotRepository } from "../repositories/SlotRepository";
import type { AppointmentWithSlot, CreateAppointmentInput } from "../types";
import {
	calculateCalDAVNextRetryAt,
	classifyCalDAVError,
	normalizeCalDAVSyncPolicy,
	policyUsesCalDAVWriteback,
} from "../utils/caldavSync";
import { CalDAVConflictError, CalDAVService } from "./CalDAVService";
import { PushService } from "./PushService";
import { WebhookService } from "./WebhookService";

export class AppointmentService {
	private appointmentRepo: AppointmentRepository;
	private slotRepo: SlotRepository;
	private linkRepo: BookingLinkRepository;
	private mailService: MailService;
	private pushService: PushService;
	private caldavService: CalDAVService;
	private settingsRepo: SettingsRepository;
	private webhookService: WebhookService;

	constructor() {
		this.appointmentRepo = new AppointmentRepository();
		this.slotRepo = new SlotRepository();
		this.linkRepo = new BookingLinkRepository();
		this.mailService = new MailService();
		this.pushService = new PushService();
		this.caldavService = new CalDAVService();
		this.settingsRepo = new SettingsRepository();
		this.webhookService = new WebhookService();
	}

	private async isPushEnabled(): Promise<boolean> {
		const value = await this.settingsRepo.get("push_notifications_enabled");
		return value === "true";
	}

	private async isEmailEnabled(): Promise<boolean> {
		const value = await this.settingsRepo.get("email_notifications_enabled");
		return value === "true";
	}

	private async persistCalDAVSuccess(
		appointmentId: number,
		payload: Awaited<ReturnType<CalDAVService["syncApprovedAppointment"]>>,
		policy: AppointmentWithSlot["caldav_sync_policy"],
	): Promise<void> {
		await this.appointmentRepo.updateCalDAVMetadata(appointmentId, {
			...payload,
			caldav_error_category: null,
			caldav_error_retryable: null,
			caldav_retry_count: 0,
			caldav_next_retry_at: null,
			caldav_queue_status: "idle",
			caldav_queued_at: null,
			caldav_sync_policy: policy,
			caldav_conflict_state: null,
			caldav_conflict_detail: null,
			caldav_remote_etag: payload?.caldav_etag ?? null,
		});
	}

	private async persistCalDAVError(
		appointmentId: number,
		error: unknown,
		policy: AppointmentWithSlot["caldav_sync_policy"],
	): Promise<void> {
		const classified = classifyCalDAVError(
			error,
			t("general.caldavConnectionFailed"),
		);
		await this.appointmentRepo.updateCalDAVMetadata(appointmentId, {
			caldav_sync_error: classified.message,
			caldav_error_category: classified.category,
			caldav_error_retryable: classified.retryable,
			caldav_retry_count: 1,
			caldav_next_retry_at: classified.retryable
				? calculateCalDAVNextRetryAt(1)
				: null,
			caldav_queue_status: classified.retryable ? "retryable" : "failed",
			caldav_queued_at: new Date().toISOString(),
			caldav_sync_policy: policy,
			caldav_last_conflict_at:
				classified.category === "conflict" ? new Date().toISOString() : null,
			caldav_conflict_count: classified.category === "conflict" ? 1 : 0,
			caldav_conflict_state:
				classified.category === "conflict" ? "detected" : null,
			caldav_conflict_detail:
				error instanceof CalDAVConflictError ? error.message : null,
			caldav_remote_etag:
				error instanceof CalDAVConflictError ? error.remoteEtag : null,
		});
	}

	private async getEffectiveCalDAVSyncPolicy(
		appointment?: AppointmentWithSlot,
	): Promise<Exclude<AppointmentWithSlot["caldav_sync_policy"], null>> {
		if (appointment?.caldav_sync_policy) {
			return normalizeCalDAVSyncPolicy(appointment.caldav_sync_policy);
		}

		return this.caldavService.getDefaultSyncPolicy();
	}

	private async markCalDAVWriteSkipped(
		appointmentId: number,
		policy: AppointmentWithSlot["caldav_sync_policy"],
	): Promise<void> {
		await this.appointmentRepo.updateCalDAVMetadata(appointmentId, {
			caldav_sync_error: null,
			caldav_error_category: null,
			caldav_error_retryable: null,
			caldav_retry_count: null,
			caldav_next_retry_at: null,
			caldav_queue_status: "idle",
			caldav_queued_at: null,
			caldav_sync_policy: policy,
			caldav_conflict_state: null,
			caldav_conflict_detail: null,
		});
	}

	async getAllAppointments(options?: {
		status?: "pending" | "approved" | "rejected" | "all";
	}): Promise<AppointmentWithSlot[]> {
		return this.appointmentRepo.findAll(options);
	}

	async getAppointmentBySlugId(slugId: string): Promise<AppointmentWithSlot> {
		const appointment = await this.appointmentRepo.findBySlugId(slugId);
		if (!appointment) {
			throw new Error(t("appointment.invalidCancelLink"));
		}

		return appointment;
	}

	async createAppointment(
		slugId: string,
		input: CreateAppointmentInput,
	): Promise<AppointmentWithSlot> {
		// Validate booking link
		const link = await this.linkRepo.findValidBySlug(slugId);
		if (!link) {
			throw new Error(t("appointment.invalidBookingLink"));
		}
		if (
			link.allowed_slot_ids.length > 0 &&
			!link.allowed_slot_ids.includes(input.slot_id)
		) {
			throw new Error(t("appointment.slotNotAllowedForLink"));
		}

		// Require guestEmail if requiresApproval is true
		if (link.requires_approval && !input.email?.trim()) {
			throw new Error(t("appointment.emailRequiredForApproval"));
		}

		// Validate slot exists and is active
		const slot = await this.slotRepo.findById(input.slot_id);
		if (!slot) {
			throw new Error(t("slot.notFound"));
		}
		if (!slot.is_active) {
			throw new Error(t("appointment.slotNotAvailable"));
		}

		const startDate = new Date(input.start_at);
		const endDate = new Date(input.end_at);
		if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
			throw new Error(t("appointment.invalidDateRange"));
		}
		if (endDate <= startDate) {
			throw new Error(t("appointment.endAfterStart"));
		}

		const slotStartDate = new Date(slot.start_at);
		const slotEndDate = new Date(slot.end_at);
		if (startDate < slotStartDate || endDate > slotEndDate) {
			throw new Error(t("appointment.outsideSlot"));
		}

		const hasCalDAVConflict = await this.caldavService.hasBusyConflict(
			input.start_at,
			input.end_at,
		);
		if (hasCalDAVConflict) {
			throw new Error(t("appointment.overlap"));
		}

		// Use a transaction to prevent overlapping bookings in the same slot
		const appointment = await AppDataSource.transaction(async (manager) => {
			const hasOverlap = await this.appointmentRepo.hasOverlapInSlot(
				input.slot_id,
				input.start_at,
				input.end_at,
				manager,
			);
			if (hasOverlap) {
				throw new Error(t("appointment.overlap"));
			}

			const status = link.requires_approval ? "pending" : "approved";

			return this.appointmentRepo.create(
				{
					...input,
					status,
				},
				manager,
			);
		});

		// Get the full appointment with slot details
		const fullAppointment = await this.appointmentRepo.findById(appointment.id);
		if (!fullAppointment) {
			throw new Error(t("appointment.loadError"));
		}

		if (fullAppointment.status === "approved") {
			const syncPolicy =
				await this.getEffectiveCalDAVSyncPolicy(fullAppointment);
			if (!policyUsesCalDAVWriteback(syncPolicy)) {
				await this.markCalDAVWriteSkipped(fullAppointment.id, syncPolicy);
			} else {
				try {
					const metadata =
						await this.caldavService.syncApprovedAppointment(fullAppointment);
					await this.persistCalDAVSuccess(
						fullAppointment.id,
						metadata,
						syncPolicy,
					);
				} catch (error) {
					await this.persistCalDAVError(fullAppointment.id, error, syncPolicy);
				}
			}
		}

		// Send emails asynchronously - do not block the response
		const emailEnabled = await this.isEmailEnabled();
		if (emailEnabled) {
			if (fullAppointment.status === "approved") {
				if (fullAppointment.email) {
					this.mailService
						.sendBookingConfirmation(fullAppointment)
						.catch((err) =>
							console.error("Failed to send confirmation email:", err),
						);
				}
			} else if (fullAppointment.status === "pending") {
				// Maybe a "Pending approval" email here?
				// For now let's just send admin notification
			}

			this.mailService
				.sendAdminNotification(fullAppointment)
				.catch((err) =>
					console.error("Failed to send admin notification:", err),
				);
		}

		const pushEnabled = await this.isPushEnabled();
		if (pushEnabled) {
			const title =
				fullAppointment.status === "pending"
					? t("push.newPendingBookingTitle")
					: t("push.newBookingTitle");
			const body =
				fullAppointment.status === "pending"
					? `${t("push.newPendingBookingBody")} ${fullAppointment.name}`
					: `${t("push.newBookingBody")} ${fullAppointment.name}`;

			this.pushService
				.sendToAll({
					title,
					body,
					url: "/admin/appointments",
				})
				.catch((err) =>
					console.error("Failed to send push notification:", err),
				);
		}

		this.webhookService
			.sendEvent("appointment.created", {
				appointment: fullAppointment,
				booking_link_slug_id: slugId,
			})
			.catch((err) =>
				console.error("Failed to send appointment.created webhook:", err),
			);

		return fullAppointment;
	}

	async approveAppointmentBySlugId(
		slugId: string,
	): Promise<AppointmentWithSlot> {
		const appointment = await this.appointmentRepo.findBySlugId(slugId);
		if (!appointment) throw new Error(t("appointment.notFound"));
		if (appointment.status !== "pending") {
			throw new Error(t("appointment.notPending"));
		}

		const hasCalDAVConflict = await this.caldavService.hasBusyConflict(
			appointment.start_at,
			appointment.end_at,
		);
		if (hasCalDAVConflict) {
			throw new Error(t("appointment.overlap"));
		}

		const approved = await this.appointmentRepo.updateStatus(
			appointment.id,
			"approved",
		);
		if (!approved) throw new Error(t("appointment.loadError"));

		const syncPolicy = await this.getEffectiveCalDAVSyncPolicy(approved);
		if (!policyUsesCalDAVWriteback(syncPolicy)) {
			await this.markCalDAVWriteSkipped(approved.id, syncPolicy);
		} else {
			try {
				const metadata =
					await this.caldavService.syncApprovedAppointment(approved);
				await this.persistCalDAVSuccess(approved.id, metadata, syncPolicy);
			} catch (error) {
				await this.persistCalDAVError(approved.id, error, syncPolicy);
			}
		}

		// Send notification
		const emailEnabled = await this.isEmailEnabled();
		if (emailEnabled && approved.email) {
			this.mailService
				.sendBookingConfirmation(approved)
				.catch((err) =>
					console.error("Failed to send confirmation email:", err),
				);
		}

		this.webhookService
			.sendEvent("appointment.approved", { appointment: approved })
			.catch((err) =>
				console.error("Failed to send appointment.approved webhook:", err),
			);

		return approved;
	}

	async rejectAppointmentBySlugId(
		slugId: string,
	): Promise<AppointmentWithSlot> {
		const appointment = await this.appointmentRepo.findBySlugId(slugId);
		if (!appointment) throw new Error(t("appointment.notFound"));
		if (appointment.status !== "pending") {
			throw new Error(t("appointment.notPending"));
		}

		const rejected = await this.appointmentRepo.updateStatus(
			appointment.id,
			"rejected",
		);
		if (!rejected) throw new Error(t("appointment.loadError"));

		if (appointment.caldav_uid) {
			const syncPolicy = await this.getEffectiveCalDAVSyncPolicy(rejected);
			if (!policyUsesCalDAVWriteback(syncPolicy)) {
				await this.markCalDAVWriteSkipped(rejected.id, syncPolicy);
			} else {
				try {
					await this.caldavService.deleteAppointmentFromCalendar(appointment);
				} catch (error) {
					await this.persistCalDAVError(rejected.id, error, syncPolicy);
				}
			}
		}

		// Send notification
		const emailEnabled = await this.isEmailEnabled();
		if (emailEnabled && rejected.email) {
			this.mailService
				.sendBookingRejection(rejected)
				.catch((err) => console.error("Failed to send rejection email:", err));
		}

		this.webhookService
			.sendEvent("appointment.rejected", { appointment: rejected })
			.catch((err) =>
				console.error("Failed to send appointment.rejected webhook:", err),
			);

		return rejected;
	}

	async deleteAppointmentBySlugId(slugId: string): Promise<boolean> {
		const appointment = await this.appointmentRepo.findBySlugId(slugId);
		if (!appointment) throw new Error(t("appointment.notFound"));

		const hasEnded = new Date(appointment.end_at).getTime() < Date.now();
		const canDelete = Boolean(appointment.canceled_at) || hasEnded;
		if (!canDelete) {
			throw new Error(t("appointment.deleteOnlyPastOrCanceled"));
		}

		if (appointment.caldav_uid) {
			try {
				await this.caldavService.deleteAppointmentFromCalendar(appointment);
			} catch (error) {
				console.error("Failed to delete appointment from CalDAV:", error);
			}
		}

		const deleted = await this.appointmentRepo.deleteBySlugId(slugId);
		if (deleted) {
			this.webhookService
				.sendEvent("appointment.deleted", { appointment })
				.catch((err) =>
					console.error("Failed to send appointment.deleted webhook:", err),
				);
		}
		return deleted;
	}

	async cancelAppointmentBySlugIdForAdmin(
		slugId: string,
	): Promise<AppointmentWithSlot> {
		const appointment = await this.appointmentRepo.findBySlugId(slugId);
		if (!appointment) throw new Error(t("appointment.notFound"));
		if (appointment.canceled_at) {
			throw new Error(t("appointment.alreadyCanceled"));
		}

		const canceled = await this.appointmentRepo.markCancelledBySlugId(
			slugId,
			"admin",
		);
		if (!canceled) throw new Error(t("appointment.notFound"));

		if (appointment.caldav_uid) {
			const syncPolicy = await this.getEffectiveCalDAVSyncPolicy(canceled);
			if (!policyUsesCalDAVWriteback(syncPolicy)) {
				await this.markCalDAVWriteSkipped(canceled.id, syncPolicy);
			} else {
				try {
					const metadata =
						await this.caldavService.syncCanceledAppointment(canceled);
					if (metadata) {
						await this.persistCalDAVSuccess(canceled.id, metadata, syncPolicy);
					}
				} catch (error) {
					await this.persistCalDAVError(canceled.id, error, syncPolicy);
				}
			}
		}

		const emailEnabled = await this.isEmailEnabled();
		if (emailEnabled) {
			this.mailService
				.sendCancellationNotifications(canceled)
				.catch((err) =>
					console.error("Failed to send cancellation notification:", err),
				);
		}

		const pushEnabled = await this.isPushEnabled();
		if (pushEnabled) {
			this.pushService
				.sendToAll({
					title: t("push.cancellationTitle"),
					body: `${t("push.cancellationBody")} ${canceled.name}`,
					url: "/admin/appointments",
				})
				.catch((err) =>
					console.error("Failed to send push notification:", err),
				);
		}

		this.webhookService
			.sendEvent("appointment.canceled", {
				appointment: canceled,
				canceled_by: "admin",
			})
			.catch((err) =>
				console.error("Failed to send appointment.canceled webhook:", err),
			);

		return canceled;
	}

	async cancelAppointmentBySlugId(
		slugId: string,
	): Promise<AppointmentWithSlot> {
		const appointment = await this.appointmentRepo.findBySlugId(slugId);
		if (!appointment) throw new Error(t("appointment.invalidCancelLink"));
		if (appointment.canceled_at) {
			throw new Error(t("appointment.alreadyCanceled"));
		}

		const canceled = await this.appointmentRepo.markCancelledBySlugId(
			slugId,
			"guest",
		);
		if (!canceled) throw new Error(t("appointment.notFound"));

		if (appointment.caldav_uid) {
			const syncPolicy = await this.getEffectiveCalDAVSyncPolicy(canceled);
			if (!policyUsesCalDAVWriteback(syncPolicy)) {
				await this.markCalDAVWriteSkipped(canceled.id, syncPolicy);
			} else {
				try {
					const metadata =
						await this.caldavService.syncCanceledAppointment(canceled);
					if (metadata) {
						await this.persistCalDAVSuccess(canceled.id, metadata, syncPolicy);
					}
				} catch (error) {
					await this.persistCalDAVError(canceled.id, error, syncPolicy);
				}
			}
		}

		const emailEnabled = await this.isEmailEnabled();
		if (emailEnabled) {
			this.mailService
				.sendCancellationNotifications(canceled)
				.catch((err) =>
					console.error("Failed to send cancellation notification:", err),
				);
		}

		const pushEnabled = await this.isPushEnabled();
		if (pushEnabled) {
			this.pushService
				.sendToAll({
					title: t("push.cancellationTitle"),
					body: `${t("push.cancellationBody")} ${canceled.name}`,
					url: "/admin/appointments",
				})
				.catch((err) =>
					console.error("Failed to send push notification:", err),
				);
		}

		this.webhookService
			.sendEvent("appointment.canceled", {
				appointment: canceled,
				canceled_by: "guest",
			})
			.catch((err) =>
				console.error("Failed to send appointment.canceled webhook:", err),
			);

		return canceled;
	}
}
