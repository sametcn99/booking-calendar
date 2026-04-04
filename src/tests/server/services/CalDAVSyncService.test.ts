import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "bun:test";
import { config } from "../../../server/config";
import { AppDataSource } from "../../../server/db/data-source";
import { AppointmentEntity } from "../../../server/entities/AppointmentEntity";
import { AppointmentRepository } from "../../../server/repositories/AppointmentRepository";
import { CalDAVSyncService } from "../../../server/services/CalDAVSyncService";
import {
	clearDatabase,
	createTestDatabase,
	destroyTestDatabase,
	seedSlot,
	type TestDatabaseContext,
} from "../../helpers/databaseTestHarness";

const appointmentRepository = new AppointmentRepository();

function futureIso(daysAhead: number, hour: number, minute = 0): string {
	const date = new Date(Date.UTC(2026, 3, 1 + daysAhead, hour, minute, 0, 0));
	return date.toISOString();
}

async function seedAppointment(input: Partial<AppointmentEntity>) {
	const repository = AppDataSource.getRepository(AppointmentEntity);
	return repository.save(
		repository.create({
			slot_id: input.slot_id ?? 1,
			name: input.name ?? "Ada Lovelace",
			email: input.email ?? "ada@example.com",
			meeting_place: input.meeting_place ?? null,
			note: input.note ?? null,
			start_at: input.start_at ?? futureIso(5, 9),
			end_at: input.end_at ?? futureIso(5, 10),
			slug_id:
				input.slug_id ?? `slug-${Math.random().toString(36).slice(2, 10)}`,
			status: input.status ?? "approved",
			canceled_at: input.canceled_at ?? null,
			canceled_by: input.canceled_by ?? null,
			caldav_uid: input.caldav_uid ?? null,
			caldav_calendar_url: input.caldav_calendar_url ?? null,
			caldav_href: input.caldav_href ?? null,
			caldav_etag: input.caldav_etag ?? null,
			caldav_last_synced_at: input.caldav_last_synced_at ?? null,
			caldav_sync_error: input.caldav_sync_error ?? null,
			caldav_error_category: input.caldav_error_category ?? null,
			caldav_error_retryable: input.caldav_error_retryable ?? null,
			caldav_retry_count: input.caldav_retry_count ?? null,
			caldav_next_retry_at: input.caldav_next_retry_at ?? null,
			caldav_conflict_count: input.caldav_conflict_count ?? 0,
			caldav_last_conflict_at: input.caldav_last_conflict_at ?? null,
			caldav_conflict_state: input.caldav_conflict_state ?? null,
			caldav_conflict_detail: input.caldav_conflict_detail ?? null,
			caldav_remote_etag: input.caldav_remote_etag ?? null,
			caldav_queue_status: input.caldav_queue_status ?? null,
			caldav_queued_at: input.caldav_queued_at ?? null,
			caldav_sync_policy: input.caldav_sync_policy ?? null,
		}),
	);
}

describe("CalDAVSyncService", () => {
	let database: TestDatabaseContext;

	beforeAll(async () => {
		database = await createTestDatabase();
	});

	afterAll(async () => {
		await destroyTestDatabase(database);
	});

	beforeEach(async () => {
		await clearDatabase();
		(
			CalDAVSyncService as unknown as {
				runtimeState: {
					is_running: boolean;
					last_background_sync_at: string | null;
					next_background_sync_at: string | null;
					interval_id: Timer | null;
				};
			}
		).runtimeState = {
			is_running: false,
			last_background_sync_at: null,
			next_background_sync_at: null,
			interval_id: null,
		};
	});

	test("runSync updates metadata for successes and stores sync errors for failures", async () => {
		const slot = await seedSlot({
			start_at: futureIso(6, 8),
			end_at: futureIso(6, 18),
		});
		const approved = await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(6, 9),
			end_at: futureIso(6, 10),
			status: "approved",
		});
		const canceled = await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(6, 10),
			end_at: futureIso(6, 11),
			status: "approved",
			canceled_at: futureIso(6, 10, 30),
			canceled_by: "admin",
			caldav_uid: "existing-uid",
			caldav_href: "/cal/existing.ics",
			caldav_sync_error: "retry me",
		});

		const syncService = new CalDAVSyncService();
		(
			syncService as unknown as {
				caldavService: {
					getBusyIntervals: () => Promise<unknown[]>;
					getDefaultSyncPolicy: () => Promise<"one_way_write">;
					syncApprovedAppointment: (appointment: AppointmentEntity) => Promise<{
						caldav_uid: string;
						caldav_calendar_url: string;
						caldav_href: string;
						caldav_etag: string;
						caldav_last_synced_at: string;
						caldav_sync_error: null;
					}>;
					syncCanceledAppointment: () => Promise<never>;
				};
			}
		).caldavService = {
			getBusyIntervals: async () => [],
			getDefaultSyncPolicy: async () => "one_way_write",
			syncApprovedAppointment: async () => ({
				caldav_uid: "approved-uid",
				caldav_calendar_url: "https://cal.example.com/calendars/admin/main/",
				caldav_href: "/cal/approved.ics",
				caldav_etag: '"etag-1"',
				caldav_last_synced_at: futureIso(0, 12),
				caldav_sync_error: null,
			}),
			syncCanceledAppointment: async () => {
				throw new Error("cancel sync failed");
			},
		};

		const result = await syncService.runSync();

		expect(result).toEqual({
			processed_count: 2,
			success_count: 1,
			failed_count: 1,
			busy_refresh_succeeded: true,
		});

		const syncedApproved = await appointmentRepository.findById(approved.id);
		expect(syncedApproved?.caldav_uid).toBe("approved-uid");
		expect(syncedApproved?.caldav_href).toBe("/cal/approved.ics");
		expect(syncedApproved?.caldav_sync_error).toBeNull();
		expect(syncedApproved?.caldav_queue_status).toBe("idle");
		expect(syncedApproved?.caldav_retry_count).toBe(0);

		const failedCanceled = await appointmentRepository.findById(canceled.id);
		expect(failedCanceled?.caldav_uid).toBe("existing-uid");
		expect(failedCanceled?.caldav_href).toBe("/cal/existing.ics");
		expect(failedCanceled?.caldav_sync_error).toBe("cancel sync failed");
		expect(failedCanceled?.caldav_error_category).toBe("unknown");
		expect(failedCanceled?.caldav_error_retryable).toBe(true);
		expect(failedCanceled?.caldav_retry_count).toBe(1);
		expect(failedCanceled?.caldav_queue_status).toBe("retryable");
		expect(failedCanceled?.caldav_next_retry_at).not.toBeNull();
	});

	test("runSync keeps processing appointments when busy refresh fails", async () => {
		const slot = await seedSlot({
			start_at: futureIso(8, 8),
			end_at: futureIso(8, 18),
		});
		const approved = await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(8, 13),
			end_at: futureIso(8, 14),
			status: "approved",
			caldav_sync_error: "stale error",
		});

		const syncService = new CalDAVSyncService();
		(
			syncService as unknown as {
				caldavService: {
					getBusyIntervals: () => Promise<never>;
					getDefaultSyncPolicy: () => Promise<"one_way_write">;
					syncApprovedAppointment: () => Promise<{
						caldav_uid: string;
						caldav_calendar_url: string;
						caldav_href: string;
						caldav_etag: string;
						caldav_last_synced_at: string;
						caldav_sync_error: null;
					}>;
					syncCanceledAppointment: () => Promise<null>;
				};
			}
		).caldavService = {
			getBusyIntervals: async () => {
				throw new Error("calendar unavailable");
			},
			getDefaultSyncPolicy: async () => "one_way_write",
			syncApprovedAppointment: async () => ({
				caldav_uid: "approved-uid-2",
				caldav_calendar_url: "https://cal.example.com/calendars/admin/main/",
				caldav_href: "/cal/approved-2.ics",
				caldav_etag: '"etag-2"',
				caldav_last_synced_at: futureIso(0, 14),
				caldav_sync_error: null,
			}),
			syncCanceledAppointment: async () => null,
		};

		const result = await syncService.runSync();

		expect(result.busy_refresh_succeeded).toBe(false);
		expect(result.processed_count).toBe(1);
		expect(result.success_count).toBe(1);
		expect(result.failed_count).toBe(0);

		const syncedApproved = await appointmentRepository.findById(approved.id);
		expect(syncedApproved?.caldav_uid).toBe("approved-uid-2");
		expect(syncedApproved?.caldav_sync_error).toBeNull();
	});

	test("health snapshot reports error breakdown, queue summary, and degraded mode", async () => {
		const slot = await seedSlot({
			start_at: futureIso(9, 8),
			end_at: futureIso(9, 18),
		});
		await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(9, 9),
			end_at: futureIso(9, 10),
			status: "approved",
			caldav_sync_error: "authentication failed",
			caldav_error_category: "auth",
			caldav_error_retryable: false,
			caldav_retry_count: 2,
			caldav_queue_status: "failed",
			caldav_queued_at: futureIso(0, 9),
		});
		await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(9, 10),
			end_at: futureIso(9, 11),
			status: "approved",
			caldav_sync_error: "temporary network timeout",
			caldav_error_category: "network",
			caldav_error_retryable: true,
			caldav_retry_count: 1,
			caldav_next_retry_at: futureIso(0, 10),
			caldav_queue_status: "retryable",
			caldav_queued_at: futureIso(0, 10),
		});

		const previousThreshold = config.caldav.degradedFailureThreshold;
		config.caldav.degradedFailureThreshold = 1;

		try {
			const syncService = new CalDAVSyncService();
			const snapshot = await syncService.getHealthSnapshot();
			const queueSnapshot = await syncService.getQueueSnapshot(10);

			expect(snapshot.health.error_breakdown.auth).toBe(1);
			expect(snapshot.health.error_breakdown.network).toBe(1);
			expect(snapshot.health.queue.failed).toBe(1);
			expect(snapshot.health.queue.retryable).toBe(1);
			expect(snapshot.health.queue.total).toBe(2);
			expect(snapshot.health.degraded_mode.enabled).toBe(true);
			expect(snapshot.health.degraded_mode.threshold).toBe(1);
			expect(queueSnapshot.summary.total).toBe(2);
			expect(queueSnapshot.items).toHaveLength(2);
		} finally {
			config.caldav.degradedFailureThreshold = previousThreshold;
		}
	});

	test("retryAppointmentBySlugId retries a queued appointment immediately", async () => {
		const slot = await seedSlot({
			start_at: futureIso(15, 8),
			end_at: futureIso(15, 18),
		});
		const queued = await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(15, 9),
			end_at: futureIso(15, 10),
			status: "approved",
			slug_id: "retry-now",
			caldav_sync_error: "temporary network timeout",
			caldav_error_category: "network",
			caldav_error_retryable: true,
			caldav_retry_count: 1,
			caldav_next_retry_at: futureIso(20, 10),
			caldav_queue_status: "retryable",
			caldav_queued_at: futureIso(0, 10),
		});

		const syncService = new CalDAVSyncService();
		(
			syncService as unknown as {
				caldavService: {
					getDefaultSyncPolicy: () => Promise<"one_way_write">;
					syncApprovedAppointment: () => Promise<{
						caldav_uid: string;
						caldav_calendar_url: string;
						caldav_href: string;
						caldav_etag: string;
						caldav_last_synced_at: string;
						caldav_sync_error: null;
					}>;
					syncCanceledAppointment: () => Promise<null>;
				};
			}
		).caldavService = {
			getDefaultSyncPolicy: async () => "one_way_write",
			syncApprovedAppointment: async () => ({
				caldav_uid: "retry-uid",
				caldav_calendar_url: "https://cal.example.com/calendars/admin/main/",
				caldav_href: "/cal/retry-now.ics",
				caldav_etag: '"retry-etag"',
				caldav_last_synced_at: futureIso(0, 18),
				caldav_sync_error: null,
			}),
			syncCanceledAppointment: async () => null,
		};

		const result = await syncService.retryAppointmentBySlugId(
			queued.slug_id ?? "",
		);

		expect(result.attempted).toBe(true);
		expect(result.blocked_by_policy).toBe(false);
		expect(result.appointment?.caldav_uid).toBe("retry-uid");
		expect(result.appointment?.caldav_sync_error).toBeNull();
		expect(result.appointment?.caldav_queue_status).toBe("idle");
	});

	test("queue snapshot exposes conflict detail and repair actions", async () => {
		const slot = await seedSlot({
			start_at: futureIso(13, 8),
			end_at: futureIso(13, 18),
		});
		await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(13, 9),
			end_at: futureIso(13, 10),
			status: "approved",
			slug_id: "conflict-item",
			caldav_sync_error:
				"CalDAV event changed remotely. Refresh the remote ETag or force overwrite.",
			caldav_error_category: "conflict",
			caldav_error_retryable: true,
			caldav_retry_count: 2,
			caldav_conflict_count: 2,
			caldav_last_conflict_at: futureIso(0, 11),
			caldav_conflict_state: "detected",
			caldav_conflict_detail: "ETag mismatch detected",
			caldav_etag: '"local-etag"',
			caldav_remote_etag: '"remote-etag"',
			caldav_queue_status: "retryable",
			caldav_queued_at: futureIso(0, 11),
		});

		const syncService = new CalDAVSyncService();
		const queueSnapshot = await syncService.getQueueSnapshot(10);
		const conflictItem = queueSnapshot.items[0];

		expect(conflictItem.slug_id).toBe("conflict-item");
		expect(conflictItem.conflict?.detail).toBe("ETag mismatch detected");
		expect(conflictItem.conflict?.local_etag).toBe('"local-etag"');
		expect(conflictItem.conflict?.remote_etag).toBe('"remote-etag"');
		expect(conflictItem.available_actions).toEqual([
			"retry",
			"refresh_etag",
			"force_overwrite",
		]);
	});

	test("repairAppointmentBySlugId refreshes the remote ETag and clears conflict metadata", async () => {
		const slot = await seedSlot({
			start_at: futureIso(16, 8),
			end_at: futureIso(16, 18),
		});
		const queued = await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(16, 9),
			end_at: futureIso(16, 10),
			status: "approved",
			slug_id: "repair-etag",
			caldav_uid: "repair-uid",
			caldav_href: "/cal/repair.ics",
			caldav_etag: '"local-etag"',
			caldav_sync_error:
				"CalDAV event changed remotely. Refresh the remote ETag or force overwrite.",
			caldav_error_category: "conflict",
			caldav_error_retryable: true,
			caldav_retry_count: 1,
			caldav_conflict_count: 1,
			caldav_last_conflict_at: futureIso(0, 10),
			caldav_conflict_state: "detected",
			caldav_conflict_detail: "ETag mismatch detected",
			caldav_remote_etag: '"remote-etag"',
			caldav_queue_status: "retryable",
			caldav_queued_at: futureIso(0, 10),
		});

		const syncService = new CalDAVSyncService();
		(
			syncService as unknown as {
				caldavService: {
					getDefaultSyncPolicy: () => Promise<"one_way_write">;
					refreshAppointmentETag: () => Promise<string>;
					syncApprovedAppointment: () => Promise<{
						caldav_uid: string;
						caldav_calendar_url: string;
						caldav_href: string;
						caldav_etag: string;
						caldav_last_synced_at: string;
						caldav_sync_error: null;
					}>;
					syncCanceledAppointment: () => Promise<null>;
				};
			}
		).caldavService = {
			getDefaultSyncPolicy: async () => "one_way_write",
			refreshAppointmentETag: async () => '"remote-etag"',
			syncApprovedAppointment: async () => ({
				caldav_uid: queued.caldav_uid ?? "repair-uid",
				caldav_calendar_url: "https://cal.example.com/calendars/admin/main/",
				caldav_href: queued.caldav_href ?? "/cal/repair.ics",
				caldav_etag: '"fresh-etag"',
				caldav_last_synced_at: futureIso(0, 19),
				caldav_sync_error: null,
			}),
			syncCanceledAppointment: async () => null,
		};

		const result = await syncService.repairAppointmentBySlugId(
			queued.slug_id ?? "",
			"refresh_etag",
		);

		expect(result.attempted).toBe(true);
		expect(result.blocked_by_policy).toBe(false);
		expect(result.appointment?.caldav_etag).toBe('"fresh-etag"');
		expect(result.appointment?.caldav_conflict_state).toBeNull();
		expect(result.appointment?.caldav_conflict_detail).toBeNull();
		expect(result.appointment?.caldav_queue_status).toBe("idle");
	});
});
