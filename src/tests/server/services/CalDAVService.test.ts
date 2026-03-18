import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "bun:test";
import { SettingsRepository } from "../../../server/repositories/SettingsRepository";
import {
	CalDAVConflictError,
	CalDAVService,
} from "../../../server/services/CalDAVService";
import type {
	AppointmentWithSlot,
	CalDAVCalendarSummary,
} from "../../../server/types";
import {
	clearDatabase,
	createTestDatabase,
	destroyTestDatabase,
	type TestDatabaseContext,
} from "../../helpers/databaseTestHarness";

const settingsRepository = new SettingsRepository();

function futureIso(daysAhead: number, hour: number, minute = 0): string {
	const date = new Date(Date.UTC(2026, 3, 1 + daysAhead, hour, minute, 0, 0));
	return date.toISOString();
}

describe("CalDAVService", () => {
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

	test("updateSettings encrypts the password and returns public-safe settings", async () => {
		const service = new CalDAVService();
		const calendars: CalDAVCalendarSummary[] = [
			{
				url: "https://cal.example.com/calendars/admin/main/",
				display_name: "Main",
				color: null,
				ctag: null,
				supports_events: true,
			},
		];

		(
			service as unknown as {
				discoverCalendars: (
					input?: Record<string, string | boolean | undefined>,
				) => Promise<CalDAVCalendarSummary[]>;
			}
		).discoverCalendars = async () => calendars;

		const settings = await service.updateSettings({
			enabled: true,
			base_url: "https://cal.example.com/",
			username: " admin ",
			password: "super-secret",
			writable_calendar_url: calendars[0].url,
		});

		expect(settings.enabled).toBe(true);
		expect(settings.base_url).toBe("https://cal.example.com");
		expect(settings.username).toBe("admin");
		expect(settings.has_password).toBe(true);
		expect(settings.writable_calendar_url).toBe(calendars[0].url);
		expect(settings.default_sync_policy).toBe("one_way_write");

		const storedPassword = await settingsRepository.get("caldav_password");
		expect(storedPassword).not.toBe("super-secret");
		expect(storedPassword?.startsWith("enc-v1:")).toBe(true);

		const publicSettings = await service.getPublicSettings();
		expect(publicSettings.has_password).toBe(true);
		expect(publicSettings.last_sync_status).toBe("idle");

		const policySettings =
			await service.updateDefaultSyncPolicy("read_only_busy");
		expect(policySettings.default_sync_policy).toBe("read_only_busy");
		expect(await service.getDefaultSyncPolicy()).toBe("read_only_busy");
	});

	test("getBusyIntervals merges overlapping events, ignores cancelled events, and reuses cache", async () => {
		const service = new CalDAVService();
		await settingsRepository.set("caldav_enabled", "true");
		await settingsRepository.set("caldav_base_url", "https://cal.example.com");
		await settingsRepository.set("caldav_username", "admin");
		await settingsRepository.set("caldav_password", "plain-password");

		let getEventsCalls = 0;
		const fakeClient = {
			getCalendars: async () => [
				{
					url: "/calendars/admin/work/",
					displayName: "Work",
					color: null,
					ctag: null,
					supportedComponents: ["VEVENT"],
				},
				{
					url: "/calendars/admin/tasks/",
					displayName: "Tasks",
					color: null,
					ctag: null,
					supportedComponents: ["VTODO"],
				},
				{
					url: "/calendars/admin/personal/",
					displayName: "Personal",
					color: null,
					ctag: null,
					supportedComponents: ["VEVENT"],
				},
			],
			getEvents: async (calendarUrl: string) => {
				getEventsCalls += 1;
				if (calendarUrl.includes("work")) {
					return [
						{
							start: new Date(futureIso(5, 9)),
							end: new Date(futureIso(5, 10)),
							status: "CONFIRMED",
						},
						{
							start: new Date(futureIso(5, 9, 30)),
							end: new Date(futureIso(5, 11)),
							status: "CONFIRMED",
						},
						{
							start: new Date(futureIso(5, 12)),
							end: new Date(futureIso(5, 13)),
							status: "CANCELLED",
						},
					];
				}

				return [
					{
						start: new Date(futureIso(5, 10, 30)),
						end: new Date(futureIso(5, 11, 30)),
						status: "CONFIRMED",
					},
					{
						start: new Date(futureIso(5, 14)),
						end: new Date(futureIso(5, 15)),
						status: "CONFIRMED",
					},
				];
			},
		};

		(
			service as unknown as {
				createClient: () => Promise<typeof fakeClient>;
			}
		).createClient = async () => fakeClient;

		const intervals = await service.getBusyIntervals(
			futureIso(5, 8),
			futureIso(5, 16),
		);

		expect(intervals).toEqual([
			{
				start_at: futureIso(5, 9),
				end_at: futureIso(5, 11, 30),
			},
			{
				start_at: futureIso(5, 14),
				end_at: futureIso(5, 15),
			},
		]);
		expect(getEventsCalls).toBe(2);

		const cachedIntervals = await service.getBusyIntervals(
			futureIso(5, 8),
			futureIso(5, 16),
		);

		expect(cachedIntervals).toEqual(intervals);
		expect(getEventsCalls).toBe(2);
	});

	test("syncApprovedAppointment raises a conflict error when the remote ETag changed", async () => {
		const service = new CalDAVService();
		await settingsRepository.set("caldav_enabled", "true");
		await settingsRepository.set("caldav_base_url", "https://cal.example.com");
		await settingsRepository.set("caldav_username", "admin");
		await settingsRepository.set("caldav_password", "plain-password");
		await settingsRepository.set(
			"caldav_writable_calendar_url",
			"https://cal.example.com/calendars/admin/main/",
		);

		(
			service as unknown as {
				createClient: () => Promise<{ getETag: () => Promise<string> }>;
			}
		).createClient = async () => ({
			getETag: async () => '"local-etag"',
		});

		const originalFetch = globalThis.fetch;
		globalThis.fetch = (async (
			_input: RequestInfo | URL,
			init?: RequestInit,
		) => {
			if (init?.method === "PUT") {
				return new Response(null, {
					status: 412,
					headers: {
						etag: '"remote-etag"',
					},
				});
			}

			return new Response("BEGIN:VCALENDAR", {
				status: 200,
				headers: {
					etag: '"remote-etag"',
				},
			});
		}) as typeof fetch;

		const appointment = {
			id: 1,
			slot_id: 1,
			name: "Ada Lovelace",
			email: "ada@example.com",
			meeting_place: null,
			note: null,
			start_at: futureIso(20, 9),
			end_at: futureIso(20, 10),
			slug_id: "conflict-case",
			status: "approved",
			canceled_at: null,
			canceled_by: null,
			created_at: futureIso(0, 8),
			caldav_uid: "existing-uid",
			caldav_calendar_url: "https://cal.example.com/calendars/admin/main/",
			caldav_href: "/cal/existing.ics",
			caldav_etag: '"local-etag"',
			caldav_last_synced_at: null,
			caldav_sync_error: null,
			caldav_error_category: null,
			caldav_error_retryable: null,
			caldav_retry_count: null,
			caldav_next_retry_at: null,
			caldav_conflict_count: 0,
			caldav_last_conflict_at: null,
			caldav_conflict_state: null,
			caldav_conflict_detail: null,
			caldav_remote_etag: null,
			caldav_queue_status: null,
			caldav_queued_at: null,
			caldav_sync_policy: "one_way_write",
		} satisfies AppointmentWithSlot;

		try {
			await service.syncApprovedAppointment(appointment);
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(CalDAVConflictError);
			expect((error as CalDAVConflictError).localEtag).toBe('"local-etag"');
			expect((error as CalDAVConflictError).remoteEtag).toBe('"remote-etag"');
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
