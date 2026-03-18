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
import { AppointmentRepository } from "../../../server/repositories/AppointmentRepository";
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
		}),
	);
}

describe("AppointmentRepository", () => {
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

	test("hasOverlapInSlot ignores rejected and canceled appointments", async () => {
		const slot = await seedSlot({
			start_at: futureIso(3, 9),
			end_at: futureIso(3, 12),
		});

		await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(3, 9),
			end_at: futureIso(3, 10),
			status: "approved",
		});
		await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(3, 10),
			end_at: futureIso(3, 11),
			status: "rejected",
		});
		await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(3, 11),
			end_at: futureIso(3, 12),
			status: "approved",
			canceled_at: futureIso(3, 10, 30),
			canceled_by: "admin",
		});

		expect(
			await appointmentRepository.hasOverlapInSlot(
				slot.id,
				futureIso(3, 9, 30),
				futureIso(3, 9, 45),
			),
		).toBe(true);

		expect(
			await appointmentRepository.hasOverlapInSlot(
				slot.id,
				futureIso(3, 10, 15),
				futureIso(3, 10, 45),
			),
		).toBe(false);

		expect(
			await appointmentRepository.hasOverlapInSlot(
				slot.id,
				futureIso(3, 11, 15),
				futureIso(3, 11, 45),
			),
		).toBe(false);
	});

	test("findCalDAVSyncCandidates returns only retryable future appointments", async () => {
		const slot = await seedSlot({
			start_at: futureIso(7, 8),
			end_at: futureIso(7, 18),
		});

		const unsyncedApproved = await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(7, 9),
			end_at: futureIso(7, 10),
			status: "approved",
		});
		const failedApproved = await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(7, 10),
			end_at: futureIso(7, 11),
			status: "approved",
			caldav_uid: "uid-approved",
			caldav_href: "/cal/approved.ics",
			caldav_sync_error: "temporary failure",
		});
		const canceledFailed = await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(7, 11),
			end_at: futureIso(7, 12),
			status: "approved",
			caldav_uid: "uid-canceled",
			caldav_href: "/cal/canceled.ics",
			canceled_at: futureIso(7, 11, 30),
			canceled_by: "admin",
			caldav_sync_error: "cancel failed",
		});
		await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(7, 12),
			end_at: futureIso(7, 13),
			status: "approved",
			caldav_uid: "healthy-uid",
			caldav_href: "/cal/healthy.ics",
			caldav_sync_error: null,
		});
		await seedAppointment({
			slot_id: slot.id,
			start_at: futureIso(-20, 9),
			end_at: futureIso(-20, 10),
			status: "approved",
			caldav_sync_error: "past item",
		});

		const candidates = await appointmentRepository.findCalDAVSyncCandidates(10);
		const candidateIds = candidates.map((candidate) => candidate.id);

		expect(candidateIds).toContain(unsyncedApproved.id);
		expect(candidateIds).toContain(failedApproved.id);
		expect(candidateIds).toContain(canceledFailed.id);
		expect(candidateIds).toHaveLength(3);

		expect(await appointmentRepository.countCalDAVRetryableAppointments()).toBe(
			3,
		);
		expect(await appointmentRepository.countCalDAVFailedAppointments()).toBe(3);
		expect(
			await appointmentRepository.countCalDAVUnsyncedApprovedAppointments(),
		).toBe(1);
	});
});
