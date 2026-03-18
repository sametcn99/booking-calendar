import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "bun:test";
import { AppDataSource } from "../../../server/db/data-source";
import { AppointmentEntity } from "../../../server/entities/AppointmentEntity";
import { BookingLinkEntity } from "../../../server/entities/BookingLinkEntity";
import { AppointmentRepository } from "../../../server/repositories/AppointmentRepository";
import { SettingsRepository } from "../../../server/repositories/SettingsRepository";
import { AppointmentService } from "../../../server/services/AppointmentService";
import {
	clearDatabase,
	createTestDatabase,
	destroyTestDatabase,
	seedSlot,
	type TestDatabaseContext,
} from "../../helpers/databaseTestHarness";

const appointmentRepository = new AppointmentRepository();
const settingsRepository = new SettingsRepository();

function futureIso(daysAhead: number, hour: number, minute = 0): string {
	const date = new Date(Date.UTC(2026, 3, 1 + daysAhead, hour, minute, 0, 0));
	return date.toISOString();
}

async function seedBookingLink(input: Partial<BookingLinkEntity> = {}) {
	const repository = AppDataSource.getRepository(BookingLinkEntity);
	return repository.save(
		repository.create({
			name: input.name ?? "Main Link",
			slug_id:
				input.slug_id ?? `link-${Math.random().toString(36).slice(2, 10)}`,
			allowed_slot_ids: input.allowed_slot_ids ?? "[]",
			expires_at: input.expires_at ?? futureIso(30, 0),
			requires_approval: input.requires_approval ?? false,
		}),
	);
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
				input.slug_id ??
				`appointment-${Math.random().toString(36).slice(2, 10)}`,
			status: input.status ?? "pending",
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
			caldav_queue_status: input.caldav_queue_status ?? null,
			caldav_queued_at: input.caldav_queued_at ?? null,
			caldav_sync_policy: input.caldav_sync_policy ?? null,
		}),
	);
}

describe("AppointmentService CalDAV integration", () => {
	let database: TestDatabaseContext;

	beforeAll(async () => {
		database = await createTestDatabase();
	});

	afterAll(async () => {
		await destroyTestDatabase(database);
	});

	beforeEach(async () => {
		await clearDatabase();
	});

	test("createAppointment persists CalDAV metadata after auto-approved booking sync succeeds", async () => {
		const slot = await seedSlot({
			start_at: futureIso(10, 9),
			end_at: futureIso(10, 10),
		});
		const link = await seedBookingLink({
			allowed_slot_ids: JSON.stringify([slot.id]),
			requires_approval: false,
		});
		const service = new AppointmentService();

		(
			service as unknown as {
				caldavService: {
					hasBusyConflict: (startAt: string, endAt: string) => Promise<boolean>;
					getDefaultSyncPolicy: () => Promise<"one_way_write">;
					syncApprovedAppointment: (appointment: { id: number }) => Promise<{
						caldav_uid: string;
						caldav_calendar_url: string;
						caldav_href: string;
						caldav_etag: string;
						caldav_last_synced_at: string;
						caldav_sync_error: null;
					}>;
				};
			}
		).caldavService = {
			hasBusyConflict: async () => false,
			getDefaultSyncPolicy: async () => "one_way_write",
			syncApprovedAppointment: async (appointment) => ({
				caldav_uid: `uid-${appointment.id}`,
				caldav_calendar_url: "https://cal.example.com/calendars/admin/main/",
				caldav_href: `/cal/${appointment.id}.ics`,
				caldav_etag: '"etag-create"',
				caldav_last_synced_at: futureIso(0, 12),
				caldav_sync_error: null,
			}),
		};
		(
			service as unknown as {
				webhookService: { sendEvent: () => Promise<void> };
			}
		).webhookService = { sendEvent: async () => {} };

		const created = await service.createAppointment(link.slug_id, {
			slot_id: slot.id,
			name: "Ada Lovelace",
			email: "ada@example.com",
			start_at: slot.start_at,
			end_at: slot.end_at,
		});

		expect(created.status).toBe("approved");
		const persisted = await appointmentRepository.findBySlugId(
			created.slug_id ?? "",
		);
		expect(persisted?.caldav_uid).toBe(`uid-${created.id}`);
		expect(persisted?.caldav_href).toBe(`/cal/${created.id}.ics`);
		expect(persisted?.caldav_sync_error).toBeNull();
	});

	test("approveAppointmentBySlugId stores CalDAV sync errors without blocking approval", async () => {
		const slot = await seedSlot({
			start_at: futureIso(12, 11),
			end_at: futureIso(12, 12),
		});
		const appointment = await seedAppointment({
			slot_id: slot.id,
			start_at: slot.start_at,
			end_at: slot.end_at,
			status: "pending",
			slug_id: "pending-approval",
		});
		const service = new AppointmentService();

		(
			service as unknown as {
				caldavService: {
					hasBusyConflict: () => Promise<boolean>;
					getDefaultSyncPolicy: () => Promise<"one_way_write">;
					syncApprovedAppointment: () => Promise<never>;
				};
				webhookService: { sendEvent: () => Promise<void> };
			}
		).caldavService = {
			hasBusyConflict: async () => false,
			getDefaultSyncPolicy: async () => "one_way_write",
			syncApprovedAppointment: async () => {
				throw new Error("approval sync failed");
			},
		};
		(
			service as unknown as {
				webhookService: { sendEvent: () => Promise<void> };
			}
		).webhookService = { sendEvent: async () => {} };

		const approved = await service.approveAppointmentBySlugId(
			appointment.slug_id ?? "",
		);

		expect(approved.status).toBe("approved");
		const persisted = await appointmentRepository.findById(appointment.id);
		expect(persisted?.status).toBe("approved");
		expect(persisted?.caldav_sync_error).toBe("approval sync failed");
	});

	test("createAppointment skips CalDAV writes when default sync policy is read_only_busy", async () => {
		const slot = await seedSlot({
			start_at: futureIso(11, 9),
			end_at: futureIso(11, 10),
		});
		const link = await seedBookingLink({
			allowed_slot_ids: JSON.stringify([slot.id]),
			requires_approval: false,
		});
		await settingsRepository.set(
			"caldav_default_sync_policy",
			"read_only_busy",
		);

		const service = new AppointmentService();
		let syncCalled = false;

		(
			service as unknown as {
				caldavService: {
					hasBusyConflict: (startAt: string, endAt: string) => Promise<boolean>;
					getDefaultSyncPolicy: () => Promise<"read_only_busy">;
					syncApprovedAppointment: () => Promise<never>;
				};
				webhookService: { sendEvent: () => Promise<void> };
			}
		).caldavService = {
			hasBusyConflict: async () => false,
			getDefaultSyncPolicy: async () => "read_only_busy",
			syncApprovedAppointment: async () => {
				syncCalled = true;
				throw new Error("should not be called");
			},
		};
		(
			service as unknown as {
				webhookService: { sendEvent: () => Promise<void> };
			}
		).webhookService = { sendEvent: async () => {} };

		const created = await service.createAppointment(link.slug_id, {
			slot_id: slot.id,
			name: "Ada Lovelace",
			email: "ada@example.com",
			start_at: slot.start_at,
			end_at: slot.end_at,
		});

		expect(created.status).toBe("approved");
		expect(syncCalled).toBe(false);
		const persisted = await appointmentRepository.findById(created.id);
		expect(persisted?.caldav_uid).toBeNull();
		expect(persisted?.caldav_sync_policy).toBe("read_only_busy");
		expect(persisted?.caldav_queue_status).toBe("idle");
	});

	test("cancelAppointmentBySlugIdForAdmin persists returned CalDAV cancellation metadata", async () => {
		const slot = await seedSlot({
			start_at: futureIso(14, 15),
			end_at: futureIso(14, 16),
		});
		const appointment = await seedAppointment({
			slot_id: slot.id,
			start_at: slot.start_at,
			end_at: slot.end_at,
			status: "approved",
			slug_id: "cancel-target",
			caldav_uid: "existing-uid",
			caldav_href: "/cal/existing.ics",
			caldav_etag: '"old-etag"',
		});
		const service = new AppointmentService();

		(
			service as unknown as {
				caldavService: {
					getDefaultSyncPolicy: () => Promise<"one_way_write">;
					syncCanceledAppointment: () => Promise<{
						caldav_uid: string;
						caldav_calendar_url: string;
						caldav_href: string;
						caldav_etag: string;
						caldav_last_synced_at: string;
						caldav_sync_error: null;
					}>;
				};
				webhookService: { sendEvent: () => Promise<void> };
			}
		).caldavService = {
			getDefaultSyncPolicy: async () => "one_way_write",
			syncCanceledAppointment: async () => ({
				caldav_uid: "existing-uid",
				caldav_calendar_url: "https://cal.example.com/calendars/admin/main/",
				caldav_href: "/cal/existing.ics",
				caldav_etag: '"cancel-etag"',
				caldav_last_synced_at: futureIso(0, 16),
				caldav_sync_error: null,
			}),
		};
		(
			service as unknown as {
				webhookService: { sendEvent: () => Promise<void> };
			}
		).webhookService = { sendEvent: async () => {} };

		const canceled = await service.cancelAppointmentBySlugIdForAdmin(
			appointment.slug_id ?? "",
		);

		expect(canceled.canceled_by).toBe("admin");
		const persisted = await appointmentRepository.findById(appointment.id);
		expect(persisted?.canceled_by).toBe("admin");
		expect(persisted?.caldav_etag).toBe('"cancel-etag"');
		expect(persisted?.caldav_sync_error).toBeNull();
	});
});
