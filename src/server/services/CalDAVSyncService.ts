import { config } from "../config";
import { t } from "../i18n";
import { AppointmentRepository } from "../repositories/AppointmentRepository";
import type {
	AppointmentWithSlot,
	CalDAVAdminSettings,
	CalDAVHealthSnapshot,
	CalDAVQueueItem,
	CalDAVRepairAction,
	CalDAVSyncHealth,
	CalDAVSyncPolicy,
	CalDAVSyncRunResult,
} from "../types";
import {
	calculateCalDAVNextRetryAt,
	classifyCalDAVError,
	policyUsesCalDAVWriteback,
} from "../utils/caldavSync";
import { CalDAVConflictError, CalDAVService } from "./CalDAVService";

interface CalDAVSyncRuntimeState {
	is_running: boolean;
	last_background_sync_at: string | null;
	next_background_sync_at: string | null;
	interval_id: ReturnType<typeof setInterval> | null;
}

export class CalDAVSyncService {
	private static runtimeState: CalDAVSyncRuntimeState = {
		is_running: false,
		last_background_sync_at: null,
		next_background_sync_at: null,
		interval_id: null,
	};

	private appointmentRepo: AppointmentRepository;
	private caldavService: CalDAVService;

	constructor() {
		this.appointmentRepo = new AppointmentRepository();
		this.caldavService = new CalDAVService();
	}

	private get backgroundSyncEnabled(): boolean {
		return config.caldav.backgroundSyncIntervalMs > 0;
	}

	private scheduleNextRun(): void {
		CalDAVSyncService.runtimeState.next_background_sync_at = this
			.backgroundSyncEnabled
			? new Date(
					Date.now() + config.caldav.backgroundSyncIntervalMs,
				).toISOString()
			: null;
	}

	private async syncAppointment(
		appointment: AppointmentWithSlot,
		policy: CalDAVSyncPolicy,
		options: { ignore_etag?: boolean } = {},
	): Promise<"success" | "failed"> {
		await this.appointmentRepo.updateCalDAVMetadata(appointment.id, {
			caldav_queue_status: "syncing",
			caldav_queued_at:
				appointment.caldav_queued_at || new Date().toISOString(),
			caldav_sync_policy: policy,
		});

		try {
			const metadata = appointment.canceled_at
				? await this.caldavService.syncCanceledAppointment(appointment, options)
				: await this.caldavService.syncApprovedAppointment(
						appointment,
						options,
					);

			await this.appointmentRepo.updateCalDAVMetadata(appointment.id, {
				caldav_uid: metadata?.caldav_uid ?? appointment.caldav_uid,
				caldav_calendar_url:
					metadata?.caldav_calendar_url ?? appointment.caldav_calendar_url,
				caldav_href: metadata?.caldav_href ?? appointment.caldav_href,
				caldav_etag: metadata?.caldav_etag ?? appointment.caldav_etag,
				caldav_last_synced_at:
					metadata?.caldav_last_synced_at || new Date().toISOString(),
				caldav_sync_error: null,
				caldav_error_category: null,
				caldav_error_retryable: null,
				caldav_retry_count: 0,
				caldav_next_retry_at: null,
				caldav_queue_status: "idle",
				caldav_queued_at: null,
				caldav_sync_policy: policy,
				caldav_conflict_state: null,
				caldav_conflict_detail: null,
				caldav_remote_etag: metadata?.caldav_etag ?? appointment.caldav_etag,
			});
			return "success";
		} catch (error) {
			const classified = classifyCalDAVError(
				error,
				t("general.caldavSyncFailed"),
			);
			const retryCount = (appointment.caldav_retry_count ?? 0) + 1;
			const retryable =
				classified.retryable && retryCount < config.caldav.retryMaxAttempts;
			await this.appointmentRepo.updateCalDAVMetadata(appointment.id, {
				caldav_sync_error: classified.message,
				caldav_error_category: classified.category,
				caldav_error_retryable: retryable,
				caldav_retry_count: retryCount,
				caldav_next_retry_at: retryable
					? calculateCalDAVNextRetryAt(retryCount)
					: null,
				caldav_queue_status: retryable ? "retryable" : "failed",
				caldav_queued_at:
					appointment.caldav_queued_at || new Date().toISOString(),
				caldav_sync_policy: policy,
				caldav_last_conflict_at:
					classified.category === "conflict"
						? new Date().toISOString()
						: appointment.caldav_last_conflict_at,
				caldav_conflict_count:
					classified.category === "conflict"
						? (appointment.caldav_conflict_count ?? 0) + 1
						: appointment.caldav_conflict_count,
				caldav_conflict_state:
					classified.category === "conflict" ? "detected" : null,
				caldav_conflict_detail:
					error instanceof CalDAVConflictError ? error.message : null,
				caldav_remote_etag:
					error instanceof CalDAVConflictError ? error.remoteEtag : null,
			});
			return "failed";
		}
	}

	private async buildHealth(): Promise<CalDAVSyncHealth> {
		const [
			failedCount,
			retryableCount,
			unsyncedApprovedCount,
			errorBreakdown,
			queue,
		] = await Promise.all([
			this.appointmentRepo.countCalDAVFailedAppointments(),
			this.appointmentRepo.countCalDAVRetryableAppointments(),
			this.appointmentRepo.countCalDAVUnsyncedApprovedAppointments(),
			this.appointmentRepo.countCalDAVErrorsByCategory(),
			this.appointmentRepo.getCalDAVQueueSummary(),
		]);

		const degradedModeEnabled =
			failedCount >= config.caldav.degradedFailureThreshold;

		return {
			failed_appointments_count: failedCount,
			retryable_appointments_count: retryableCount,
			unsynced_approved_count: unsyncedApprovedCount,
			error_breakdown: errorBreakdown,
			queue,
			degraded_mode: {
				enabled: degradedModeEnabled,
				reason: null,
				threshold: config.caldav.degradedFailureThreshold,
				active_failed_count: failedCount,
			},
			background_sync_enabled: this.backgroundSyncEnabled,
			background_sync_interval_ms: config.caldav.backgroundSyncIntervalMs,
			is_sync_running: CalDAVSyncService.runtimeState.is_running,
			last_background_sync_at:
				CalDAVSyncService.runtimeState.last_background_sync_at,
			next_background_sync_at:
				CalDAVSyncService.runtimeState.next_background_sync_at,
		};
	}

	async getHealthSnapshot(): Promise<CalDAVHealthSnapshot> {
		const settings = await this.caldavService.getPublicSettings();
		const health = await this.buildHealth();
		if (health.degraded_mode.enabled && !health.degraded_mode.reason) {
			health.degraded_mode.reason = settings.last_sync_error;
		}

		return {
			last_sync_at: settings.last_sync_at,
			last_sync_status: settings.last_sync_status,
			last_sync_error: settings.last_sync_error,
			health,
		};
	}

	async getQueueSnapshot(limit = 50): Promise<{
		summary: CalDAVSyncHealth["queue"];
		items: CalDAVQueueItem[];
	}> {
		const [summary, items] = await Promise.all([
			this.appointmentRepo.getCalDAVQueueSummary(),
			this.appointmentRepo.findCalDAVQueueItems(limit),
		]);

		return { summary, items };
	}

	async getAdminSettings(): Promise<CalDAVAdminSettings> {
		const [settings, healthSnapshot] = await Promise.all([
			this.caldavService.getSettingsWithCalendars(),
			this.getHealthSnapshot(),
		]);

		return {
			...settings,
			health: healthSnapshot.health,
		};
	}

	async runSync(
		reason: "manual" | "background" = "manual",
	): Promise<CalDAVSyncRunResult> {
		if (CalDAVSyncService.runtimeState.is_running) {
			return {
				processed_count: 0,
				success_count: 0,
				failed_count: 0,
				busy_refresh_succeeded: false,
			};
		}

		CalDAVSyncService.runtimeState.is_running = true;

		let busyRefreshSucceeded = false;
		let successCount = 0;
		let failedCount = 0;

		try {
			const lookAheadEnd = new Date(
				Date.now() +
					config.caldav.backgroundSyncLookaheadDays * 24 * 60 * 60 * 1000,
			).toISOString();

			try {
				await this.caldavService.getBusyIntervals(
					new Date().toISOString(),
					lookAheadEnd,
					{ strict: true },
				);
				busyRefreshSucceeded = true;
			} catch {
				busyRefreshSucceeded = false;
			}

			const candidates = await this.appointmentRepo.findCalDAVSyncCandidates(
				config.caldav.backgroundSyncBatchSize,
			);
			const policy = await this.caldavService.getDefaultSyncPolicy();
			if (!policyUsesCalDAVWriteback(policy)) {
				return {
					processed_count: 0,
					success_count: 0,
					failed_count: 0,
					busy_refresh_succeeded: busyRefreshSucceeded,
				};
			}

			for (const appointment of candidates) {
				const outcome = await this.syncAppointment(appointment, policy);
				if (outcome === "success") {
					successCount += 1;
				} else {
					failedCount += 1;
				}
			}

			return {
				processed_count: candidates.length,
				success_count: successCount,
				failed_count: failedCount,
				busy_refresh_succeeded: busyRefreshSucceeded,
			};
		} finally {
			CalDAVSyncService.runtimeState.is_running = false;
			if (reason === "background") {
				CalDAVSyncService.runtimeState.last_background_sync_at =
					new Date().toISOString();
			}
			this.scheduleNextRun();
		}
	}

	async retryAppointmentBySlugId(slugId: string): Promise<{
		appointment: AppointmentWithSlot | null;
		attempted: boolean;
		blocked_by_policy: boolean;
	}> {
		const appointment = await this.appointmentRepo.findBySlugId(slugId);
		if (!appointment) {
			return {
				appointment: null,
				attempted: false,
				blocked_by_policy: false,
			};
		}

		const policy = await this.caldavService.getDefaultSyncPolicy();
		if (!policyUsesCalDAVWriteback(policy)) {
			await this.appointmentRepo.updateCalDAVMetadata(appointment.id, {
				caldav_sync_policy: policy,
				caldav_queue_status: "idle",
				caldav_queued_at: null,
			});
			return {
				appointment: await this.appointmentRepo.findById(appointment.id),
				attempted: false,
				blocked_by_policy: true,
			};
		}

		await this.syncAppointment(appointment, policy);
		return {
			appointment: await this.appointmentRepo.findById(appointment.id),
			attempted: true,
			blocked_by_policy: false,
		};
	}

	async repairAppointmentBySlugId(
		slugId: string,
		action: CalDAVRepairAction,
	): Promise<{
		appointment: AppointmentWithSlot | null;
		attempted: boolean;
		blocked_by_policy: boolean;
	}> {
		const appointment = await this.appointmentRepo.findBySlugId(slugId);
		if (!appointment) {
			return {
				appointment: null,
				attempted: false,
				blocked_by_policy: false,
			};
		}

		const policy = await this.caldavService.getDefaultSyncPolicy();
		if (!policyUsesCalDAVWriteback(policy)) {
			await this.appointmentRepo.updateCalDAVMetadata(appointment.id, {
				caldav_sync_policy: policy,
				caldav_queue_status: "idle",
				caldav_queued_at: null,
			});
			return {
				appointment: await this.appointmentRepo.findById(appointment.id),
				attempted: false,
				blocked_by_policy: true,
			};
		}

		if (action === "retry") {
			await this.syncAppointment(appointment, policy);
		} else if (action === "force_overwrite") {
			await this.syncAppointment(appointment, policy, { ignore_etag: true });
		} else {
			try {
				const remoteEtag =
					await this.caldavService.refreshAppointmentETag(appointment);
				if (!remoteEtag) {
					throw new Error(t("general.caldavRemoteEventNotFound"));
				}

				await this.appointmentRepo.updateCalDAVMetadata(appointment.id, {
					caldav_etag: remoteEtag,
					caldav_remote_etag: remoteEtag,
					caldav_conflict_state: null,
					caldav_conflict_detail: null,
					caldav_sync_error: null,
					caldav_error_category: null,
					caldav_error_retryable: null,
					caldav_next_retry_at: null,
					caldav_queue_status: "retryable",
					caldav_queued_at:
						appointment.caldav_queued_at || new Date().toISOString(),
					caldav_sync_policy: policy,
				});

				const refreshedAppointment = await this.appointmentRepo.findById(
					appointment.id,
				);
				if (refreshedAppointment) {
					await this.syncAppointment(refreshedAppointment, policy);
				}
			} catch (error) {
				const classified = classifyCalDAVError(
					error,
					t("general.caldavSyncFailed"),
				);
				await this.appointmentRepo.updateCalDAVMetadata(appointment.id, {
					caldav_sync_error: classified.message,
					caldav_error_category: classified.category,
					caldav_error_retryable: classified.retryable,
					caldav_queue_status: classified.retryable ? "retryable" : "failed",
					caldav_queued_at:
						appointment.caldav_queued_at || new Date().toISOString(),
					caldav_sync_policy: policy,
				});
			}
		}

		return {
			appointment: await this.appointmentRepo.findById(appointment.id),
			attempted: true,
			blocked_by_policy: false,
		};
	}

	startBackgroundSync(): void {
		if (!this.backgroundSyncEnabled) {
			CalDAVSyncService.runtimeState.next_background_sync_at = null;
			return;
		}

		if (CalDAVSyncService.runtimeState.interval_id) {
			return;
		}

		this.scheduleNextRun();
		queueMicrotask(() => {
			void this.runSync("background");
		});

		CalDAVSyncService.runtimeState.interval_id = setInterval(() => {
			this.scheduleNextRun();
			void this.runSync("background");
		}, config.caldav.backgroundSyncIntervalMs);
	}
}
