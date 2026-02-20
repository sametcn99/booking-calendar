import { AppDataSource } from "../db/data-source";
import { t } from "../i18n";
import { MailService } from "../mail/MailService";
import { AppointmentRepository } from "../repositories/AppointmentRepository";
import { BookingLinkRepository } from "../repositories/BookingLinkRepository";
import { SettingsRepository } from "../repositories/SettingsRepository";
import { SlotRepository } from "../repositories/SlotRepository";
import type { AppointmentWithSlot, CreateAppointmentInput } from "../types";
import { PushService } from "./PushService";

export class AppointmentService {
	private appointmentRepo: AppointmentRepository;
	private slotRepo: SlotRepository;
	private linkRepo: BookingLinkRepository;
	private mailService: MailService;
	private pushService: PushService;
	private settingsRepo: SettingsRepository;

	constructor() {
		this.appointmentRepo = new AppointmentRepository();
		this.slotRepo = new SlotRepository();
		this.linkRepo = new BookingLinkRepository();
		this.mailService = new MailService();
		this.pushService = new PushService();
		this.settingsRepo = new SettingsRepository();
	}

	private async isPushEnabled(): Promise<boolean> {
		const value = await this.settingsRepo.get("push_notifications_enabled");
		return value !== "false";
	}

	private async isEmailEnabled(): Promise<boolean> {
		const value = await this.settingsRepo.get("email_notifications_enabled");
		return value !== "false";
	}

	async getAllAppointments(): Promise<AppointmentWithSlot[]> {
		return this.appointmentRepo.findAll();
	}

	async getAppointmentByToken(token: string): Promise<AppointmentWithSlot> {
		const appointment = await this.appointmentRepo.findByCancelToken(token);
		if (!appointment) {
			throw new Error(t("appointment.invalidCancelLink"));
		}

		return appointment;
	}

	async createAppointment(
		token: string,
		input: CreateAppointmentInput,
	): Promise<AppointmentWithSlot> {
		// Validate booking link
		const link = await this.linkRepo.findValidBySlug(token);
		if (!link) {
			throw new Error(t("appointment.invalidBookingLink"));
		}
		if (
			link.allowed_slot_ids.length > 0 &&
			!link.allowed_slot_ids.includes(input.slot_id)
		) {
			throw new Error(t("appointment.slotNotAllowedForLink"));
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

			return this.appointmentRepo.create(input, manager);
		});

		// Get the full appointment with slot details
		const fullAppointment = await this.appointmentRepo.findById(appointment.id);
		if (!fullAppointment) {
			throw new Error(t("appointment.loadError"));
		}

		// Send emails asynchronously - do not block the response
		const emailEnabled = await this.isEmailEnabled();
		if (emailEnabled) {
			if (fullAppointment.email) {
				this.mailService
					.sendBookingConfirmation(fullAppointment)
					.catch((err) =>
						console.error("Failed to send confirmation email:", err),
					);
			}
			this.mailService
				.sendAdminNotification(fullAppointment)
				.catch((err) =>
					console.error("Failed to send admin notification:", err),
				);
		}

		const pushEnabled = await this.isPushEnabled();
		if (pushEnabled) {
			this.pushService
				.sendToAll({
					title: t("push.newBookingTitle"),
					body: `${t("push.newBookingBody")} ${fullAppointment.name}`,
					url: "/admin/appointments",
				})
				.catch((err) =>
					console.error("Failed to send push notification:", err),
				);
		}

		return fullAppointment;
	}

	async deleteAppointment(id: number): Promise<boolean> {
		const appointment = await this.appointmentRepo.findById(id);
		if (!appointment) throw new Error(t("appointment.notFound"));

		const hasEnded = new Date(appointment.end_at).getTime() < Date.now();
		const canDelete = Boolean(appointment.canceled_at) || hasEnded;
		if (!canDelete) {
			throw new Error(t("appointment.deleteOnlyPastOrCanceled"));
		}

		return this.appointmentRepo.delete(id);
	}

	async cancelAppointmentById(id: number): Promise<AppointmentWithSlot> {
		const appointment = await this.appointmentRepo.findById(id);
		if (!appointment) throw new Error(t("appointment.notFound"));
		if (appointment.canceled_at) {
			throw new Error(t("appointment.alreadyCanceled"));
		}

		const canceled = await this.appointmentRepo.markCancelled(id, "admin");
		if (!canceled) throw new Error(t("appointment.notFound"));

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

		return canceled;
	}

	async cancelAppointmentByToken(token: string): Promise<AppointmentWithSlot> {
		const appointment = await this.appointmentRepo.findByCancelToken(token);
		if (!appointment) throw new Error(t("appointment.invalidCancelLink"));
		if (appointment.canceled_at) {
			throw new Error(t("appointment.alreadyCanceled"));
		}

		const canceled = await this.appointmentRepo.markCancelled(
			appointment.id,
			"guest",
		);
		if (!canceled) throw new Error(t("appointment.notFound"));

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

		return canceled;
	}
}
