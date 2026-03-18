import { CalDAVClient } from "ts-caldav";
import { config } from "../config";
import { t } from "../i18n";
import { SettingsRepository } from "../repositories/SettingsRepository";
import type {
	AppointmentWithSlot,
	BusyInterval,
	CalDAVCalendarSummary,
	CalDAVSettings,
	CalDAVSettingsWithCalendars,
	CalDAVSyncPolicy,
} from "../types";
import { normalizeCalDAVSyncPolicy } from "../utils/caldavSync";

const CALDAV_SETTING_KEYS = {
	enabled: "caldav_enabled",
	baseUrl: "caldav_base_url",
	username: "caldav_username",
	password: "caldav_password",
	writableCalendarUrl: "caldav_writable_calendar_url",
	defaultSyncPolicy: "caldav_default_sync_policy",
	lastSyncAt: "caldav_last_sync_at",
	lastSyncStatus: "caldav_last_sync_status",
	lastSyncError: "caldav_last_sync_error",
} as const;

interface CalDAVCredentialsInput {
	base_url?: string;
	username?: string;
	password?: string;
}

interface UpdateCalDAVSettingsInput extends CalDAVCredentialsInput {
	enabled?: boolean;
	writable_calendar_url?: string;
	default_sync_policy?: CalDAVSyncPolicy;
}

interface ResolvedCalDAVCredentials {
	base_url: string;
	username: string;
	password: string;
}

interface BusyIntervalFetchOptions {
	strict?: boolean;
}

interface BusyIntervalCacheEntry {
	start_at: string;
	end_at: string;
	intervals: BusyInterval[];
	expires_at: number;
}

interface ClientCacheEntry {
	credential_key: string;
	cache: ReturnType<CalDAVClient["exportCache"]>;
}

interface CalDAVSyncMetadata {
	caldav_uid: string;
	caldav_calendar_url: string;
	caldav_href: string;
	caldav_etag: string;
	caldav_last_synced_at: string;
	caldav_sync_error: null;
}

interface AppointmentCalendarData {
	uid: string;
	summary: string;
	start: Date;
	end: Date;
	description?: string;
	location?: string;
	status: "CONFIRMED" | "CANCELLED";
}

interface SyncAppointmentOptions {
	ignore_etag?: boolean;
}

export class CalDAVConflictError extends Error {
	readonly localEtag: string | null;
	readonly remoteEtag: string | null;
	readonly href: string | null;

	constructor(options: {
		message: string;
		localEtag: string | null;
		remoteEtag: string | null;
		href: string | null;
	}) {
		super(options.message);
		this.name = "CalDAVConflictError";
		this.localEtag = options.localEtag;
		this.remoteEtag = options.remoteEtag;
		this.href = options.href;
	}
}

function normalizeBaseUrl(value: string): string {
	return value.trim().replace(/\/+$/, "");
}

function isValidHttpUrl(value: string): boolean {
	try {
		const parsed = new URL(value);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

function parseIsoDate(value: string): Date | null {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return parsed;
}

const textEncoder = new TextEncoder();

export class CalDAVService {
	private static busyIntervalCache: BusyIntervalCacheEntry | null = null;
	private static clientCache: ClientCacheEntry | null = null;
	private settingsRepo: SettingsRepository;

	constructor() {
		this.settingsRepo = new SettingsRepository();
	}

	private async deriveKey(): Promise<ArrayBuffer> {
		return crypto.subtle.digest(
			"SHA-256",
			textEncoder.encode(config.caldav.encryptionSecret),
		);
	}

	private base64UrlEncode(value: Uint8Array): string {
		return Buffer.from(value)
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");
	}

	private base64UrlDecode(value: string): Uint8Array {
		let normalized = value.replace(/-/g, "+").replace(/_/g, "/");
		while (normalized.length % 4 !== 0) {
			normalized += "=";
		}
		return new Uint8Array(Buffer.from(normalized, "base64"));
	}

	private async encryptSecret(value: string): Promise<string> {
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const ivBuffer = Buffer.from(iv);
		const key = await crypto.subtle.importKey(
			"raw",
			await this.deriveKey(),
			{ name: "AES-GCM" },
			false,
			["encrypt"],
		);
		const encryptedBytes = new Uint8Array(
			await crypto.subtle.encrypt(
				{ name: "AES-GCM", iv: ivBuffer },
				key,
				textEncoder.encode(value),
			),
		);
		const tagLength = 16;
		const encrypted = encryptedBytes.slice(0, -tagLength);
		const tag = encryptedBytes.slice(-tagLength);
		return [
			"enc-v1",
			this.base64UrlEncode(ivBuffer),
			this.base64UrlEncode(tag),
			this.base64UrlEncode(encrypted),
		].join(":");
	}

	private async decryptSecret(value: string): Promise<string> {
		if (!value.startsWith("enc-v1:")) {
			return value;
		}

		const [, ivEncoded, tagEncoded, dataEncoded] = value.split(":");
		if (!ivEncoded || !tagEncoded || !dataEncoded) {
			throw new Error(t("general.caldavSecretInvalid"));
		}

		const key = await crypto.subtle.importKey(
			"raw",
			await this.deriveKey(),
			{ name: "AES-GCM" },
			false,
			["decrypt"],
		);
		const iv = Buffer.from(this.base64UrlDecode(ivEncoded));
		const tag = this.base64UrlDecode(tagEncoded);
		const encrypted = this.base64UrlDecode(dataEncoded);
		const payload = new Uint8Array(encrypted.length + tag.length);
		payload.set(encrypted);
		payload.set(tag, encrypted.length);
		const decrypted = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv },
			key,
			Buffer.from(payload),
		);
		return Buffer.from(decrypted).toString("utf8");
	}

	private async getStoredPassword(): Promise<string> {
		const rawValue = await this.settingsRepo.get(CALDAV_SETTING_KEYS.password);
		if (!rawValue) {
			return "";
		}

		return this.decryptSecret(rawValue);
	}

	private async buildResolvedCredentials(
		input: CalDAVCredentialsInput,
	): Promise<ResolvedCalDAVCredentials> {
		const storedSettings = await this.getPublicSettings();
		const base_url = normalizeBaseUrl(
			input.base_url ?? storedSettings.base_url,
		);
		const username = (input.username ?? storedSettings.username).trim();
		const password =
			typeof input.password === "string" && input.password.length > 0
				? input.password
				: await this.getStoredPassword();

		if (!base_url || !username || !password) {
			throw new Error(t("general.caldavCredentialsRequired"));
		}

		if (!isValidHttpUrl(base_url)) {
			throw new Error(t("general.invalidCaldavUrl"));
		}

		return { base_url, username, password };
	}

	private async createClient(
		input: CalDAVCredentialsInput,
	): Promise<CalDAVClient> {
		const credentials = await this.buildResolvedCredentials(input);
		const credential_key = `${credentials.base_url}|${credentials.username}`;
		const options = {
			baseUrl: credentials.base_url,
			auth: {
				type: "basic" as const,
				username: credentials.username,
				password: credentials.password,
			},
			requestTimeout: config.caldav.requestTimeoutMs,
		};

		if (CalDAVService.clientCache?.credential_key === credential_key) {
			try {
				return CalDAVClient.createFromCache(
					options,
					CalDAVService.clientCache.cache,
				);
			} catch (error) {
				console.warn("Failed to restore CalDAV client from cache:", error);
			}
		}

		const client = await CalDAVClient.create(options);
		CalDAVService.clientCache = {
			credential_key,
			cache: client.exportCache(),
		};
		return client;
	}

	private invalidateBusyIntervalCache(): void {
		CalDAVService.busyIntervalCache = null;
	}

	private invalidateClientCache(): void {
		CalDAVService.clientCache = null;
	}

	private getCachedBusyIntervals(
		startAt: string,
		endAt: string,
	): BusyInterval[] | null {
		const cache = CalDAVService.busyIntervalCache;
		if (!cache || cache.expires_at <= Date.now()) {
			return null;
		}

		if (startAt < cache.start_at || endAt > cache.end_at) {
			return null;
		}

		return cache.intervals.filter(
			(interval) => !(interval.end_at <= startAt || interval.start_at >= endAt),
		);
	}

	private rememberBusyIntervals(
		startAt: string,
		endAt: string,
		intervals: BusyInterval[],
	): void {
		CalDAVService.busyIntervalCache = {
			start_at: startAt,
			end_at: endAt,
			intervals,
			expires_at: Date.now() + config.caldav.busyCacheTtlMs,
		};
	}

	private async updateSyncStatus(
		status: "idle" | "ok" | "error",
		errorMessage: string | null,
	): Promise<void> {
		const now = status === "ok" ? new Date().toISOString() : null;
		await this.settingsRepo.set(CALDAV_SETTING_KEYS.lastSyncStatus, status);
		await this.settingsRepo.set(
			CALDAV_SETTING_KEYS.lastSyncError,
			errorMessage ?? "",
		);
		if (now) {
			await this.settingsRepo.set(CALDAV_SETTING_KEYS.lastSyncAt, now);
		}
	}

	private getWritableCalendarUrl(settings: CalDAVSettings): string {
		const writableCalendarUrl = settings.writable_calendar_url.trim();
		if (!writableCalendarUrl) {
			throw new Error(t("general.caldavWritableCalendarRequired"));
		}

		return writableCalendarUrl;
	}

	private buildAppointmentCalendarData(
		appointment: AppointmentWithSlot,
		status: "CONFIRMED" | "CANCELLED",
	): AppointmentCalendarData {
		const descriptionLines = [
			appointment.email ? `Email: ${appointment.email}` : null,
			appointment.meeting_place
				? `Meeting place: ${appointment.meeting_place}`
				: null,
			appointment.note ? `Note: ${appointment.note}` : null,
		].filter((line): line is string => Boolean(line));

		return {
			uid:
				appointment.caldav_uid ||
				`booking-calendar-${appointment.slug_id || appointment.id}@booking-calendar`,
			summary: `Booking: ${appointment.name}`,
			start: new Date(appointment.start_at),
			end: new Date(appointment.end_at),
			location: appointment.meeting_place || undefined,
			description:
				descriptionLines.length > 0 ? descriptionLines.join("\n") : undefined,
			status,
		};
	}

	private escapeICSValue(value: string): string {
		return value
			.replace(/\\/g, "\\\\")
			.replace(/\n/g, "\\n")
			.replace(/,/g, "\\,")
			.replace(/;/g, "\\;");
	}

	private formatICSDate(date: Date): string {
		return date
			.toISOString()
			.replace(/[-:]/g, "")
			.replace(/\.\d{3}Z$/, "Z");
	}

	private buildAppointmentEventICS(
		appointment: AppointmentWithSlot,
		status: "CONFIRMED" | "CANCELLED",
	): string {
		const event = this.buildAppointmentCalendarData(appointment, status);
		const lines = [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//booking-calendar//EN",
			"BEGIN:VEVENT",
			`UID:${this.escapeICSValue(event.uid)}`,
			`DTSTAMP:${this.formatICSDate(new Date())}`,
			`DTSTART:${this.formatICSDate(event.start)}`,
			`DTEND:${this.formatICSDate(event.end)}`,
			`SUMMARY:${this.escapeICSValue(event.summary)}`,
			`STATUS:${event.status}`,
		];

		if (event.description) {
			lines.push(`DESCRIPTION:${this.escapeICSValue(event.description)}`);
		}

		if (event.location) {
			lines.push(`LOCATION:${this.escapeICSValue(event.location)}`);
		}

		lines.push("END:VEVENT", "END:VCALENDAR");
		return `${lines.join("\r\n")}\r\n`;
	}

	private async putCalendarEvent(
		appointment: AppointmentWithSlot,
		status: "CONFIRMED" | "CANCELLED",
		options: SyncAppointmentOptions = {},
	): Promise<CalDAVSyncMetadata> {
		if (!appointment.caldav_href) {
			throw new Error(t("general.caldavConnectionFailed"));
		}

		const client = await this.createClient({});
		const credentials = await this.buildResolvedCredentials({});
		const href = appointment.caldav_href;
		const eventUrl = new URL(href, `${credentials.base_url}/`).toString();
		const etag =
			appointment.caldav_etag ||
			(await client.getETag(appointment.caldav_href));
		const headers: Record<string, string> = {
			Authorization: `Basic ${Buffer.from(
				`${credentials.username}:${credentials.password}`,
			).toString("base64")}`,
			"Content-Type": "text/calendar; charset=utf-8",
		};
		if (!options.ignore_etag && etag) {
			headers.IfMatch = etag;
		}
		const response = await fetch(eventUrl, {
			method: "PUT",
			headers,
			body: this.buildAppointmentEventICS(appointment, status),
		});

		if (!response.ok) {
			if (response.status === 412) {
				const remoteEtag =
					response.headers.get("etag") ||
					(await this.getRemoteETagByHref(href, credentials));
				throw new CalDAVConflictError({
					message: t("general.caldavEtagConflict"),
					localEtag: etag || null,
					remoteEtag,
					href,
				});
			}
			throw new Error(t("general.caldavConnectionFailed"));
		}

		return {
			caldav_uid:
				appointment.caldav_uid ||
				this.buildAppointmentCalendarData(appointment, status).uid,
			caldav_calendar_url:
				appointment.caldav_calendar_url ||
				this.getWritableCalendarUrl(await this.getPublicSettings()),
			caldav_href: href,
			caldav_etag: response.headers.get("etag") || (await client.getETag(href)),
			caldav_last_synced_at: new Date().toISOString(),
			caldav_sync_error: null,
		};
	}

	private buildAppointmentEventPayload(
		appointment: AppointmentWithSlot,
		status: "CONFIRMED" | "CANCELLED",
	) {
		return this.buildAppointmentCalendarData(appointment, status);
	}

	private buildBasicAuthHeader(credentials: ResolvedCalDAVCredentials): string {
		return `Basic ${Buffer.from(
			`${credentials.username}:${credentials.password}`,
		).toString("base64")}`;
	}

	private async getRemoteETagByHref(
		href: string,
		credentials: ResolvedCalDAVCredentials,
	): Promise<string | null> {
		const eventUrl = new URL(href, `${credentials.base_url}/`).toString();
		const response = await fetch(eventUrl, {
			method: "GET",
			headers: {
				Authorization: this.buildBasicAuthHeader(credentials),
			},
		});

		if (!response.ok) {
			return null;
		}

		return response.headers.get("etag") || null;
	}

	private mapCalendars(
		calendars: Awaited<ReturnType<CalDAVClient["getCalendars"]>>,
	): CalDAVCalendarSummary[] {
		return calendars
			.map((calendar) => ({
				url: calendar.url,
				display_name: calendar.displayName || calendar.url,
				color: calendar.color ?? null,
				ctag: calendar.ctag ?? null,
				supports_events: calendar.supportedComponents.includes("VEVENT"),
			}))
			.filter((calendar) => calendar.supports_events)
			.sort((left, right) =>
				left.display_name.localeCompare(right.display_name, undefined, {
					sensitivity: "base",
				}),
			);
	}

	private mergeBusyIntervals(intervals: BusyInterval[]): BusyInterval[] {
		if (intervals.length <= 1) {
			return intervals;
		}

		const sorted = [...intervals].sort((left, right) =>
			left.start_at.localeCompare(right.start_at),
		);
		const merged: BusyInterval[] = [];

		for (const interval of sorted) {
			const previous = merged.at(-1);
			if (!previous) {
				merged.push(interval);
				continue;
			}

			if (interval.start_at <= previous.end_at) {
				previous.end_at =
					interval.end_at > previous.end_at ? interval.end_at : previous.end_at;
				continue;
			}

			merged.push(interval);
		}

		return merged;
	}

	private async getEventCalendars(client: CalDAVClient) {
		const calendars = await client.getCalendars();
		return calendars.filter((calendar) =>
			calendar.supportedComponents.includes("VEVENT"),
		);
	}

	async getPublicSettings(): Promise<CalDAVSettings> {
		const [
			enabled,
			base_url,
			username,
			password,
			writable_calendar_url,
			default_sync_policy,
			last_sync_at,
			last_sync_status,
			last_sync_error,
		] = await Promise.all([
			this.settingsRepo.get(CALDAV_SETTING_KEYS.enabled),
			this.settingsRepo.get(CALDAV_SETTING_KEYS.baseUrl),
			this.settingsRepo.get(CALDAV_SETTING_KEYS.username),
			this.settingsRepo.get(CALDAV_SETTING_KEYS.password),
			this.settingsRepo.get(CALDAV_SETTING_KEYS.writableCalendarUrl),
			this.settingsRepo.get(CALDAV_SETTING_KEYS.defaultSyncPolicy),
			this.settingsRepo.get(CALDAV_SETTING_KEYS.lastSyncAt),
			this.settingsRepo.get(CALDAV_SETTING_KEYS.lastSyncStatus),
			this.settingsRepo.get(CALDAV_SETTING_KEYS.lastSyncError),
		]);

		const normalizedStatus =
			last_sync_status === "ok" || last_sync_status === "error"
				? last_sync_status
				: "idle";

		return {
			enabled: enabled === "true",
			base_url: base_url ?? "",
			username: username ?? "",
			has_password: Boolean(password),
			writable_calendar_url: writable_calendar_url ?? "",
			default_sync_policy: normalizeCalDAVSyncPolicy(default_sync_policy),
			last_sync_at: last_sync_at ?? null,
			last_sync_status: normalizedStatus,
			last_sync_error: last_sync_error ?? null,
		};
	}

	async getDefaultSyncPolicy(): Promise<CalDAVSyncPolicy> {
		const settings = await this.getPublicSettings();
		return settings.default_sync_policy;
	}

	async updateDefaultSyncPolicy(
		policy: CalDAVSyncPolicy,
	): Promise<CalDAVSettingsWithCalendars> {
		await this.settingsRepo.set(CALDAV_SETTING_KEYS.defaultSyncPolicy, policy);
		return this.getSettingsWithCalendars();
	}

	async getSettingsWithCalendars(): Promise<CalDAVSettingsWithCalendars> {
		const settings = await this.getPublicSettings();
		if (!settings.base_url || !settings.username || !settings.has_password) {
			return { ...settings, calendars: [] };
		}

		try {
			const calendars = await this.discoverCalendars();
			return { ...settings, calendars };
		} catch {
			return { ...settings, calendars: [] };
		}
	}

	async discoverCalendars(
		input: CalDAVCredentialsInput = {},
	): Promise<CalDAVCalendarSummary[]> {
		try {
			const client = await this.createClient(input);
			const calendars = await client.getCalendars();
			return this.mapCalendars(calendars);
		} catch (error) {
			console.error("Failed to discover CalDAV calendars:", error);
			throw new Error(t("general.caldavConnectionFailed"));
		}
	}

	async getBusyIntervals(
		startAt: string,
		endAt: string,
		options: BusyIntervalFetchOptions = {},
	): Promise<BusyInterval[]> {
		const settings = await this.getPublicSettings();
		if (!settings.enabled || !settings.base_url || !settings.username) {
			return [];
		}

		const startDate = parseIsoDate(startAt);
		const endDate = parseIsoDate(endAt);
		if (!startDate || !endDate || endDate <= startDate) {
			return [];
		}

		const cachedIntervals = this.getCachedBusyIntervals(startAt, endAt);
		if (cachedIntervals) {
			return cachedIntervals;
		}

		try {
			const client = await this.createClient({});
			const calendars = await this.getEventCalendars(client);
			if (calendars.length === 0) {
				return [];
			}

			const calendarEvents = await Promise.all(
				calendars.map((calendar) =>
					client.getEvents(calendar.url, {
						start: startDate,
						end: endDate,
						all: false,
					}),
				),
			);

			const intervals = calendarEvents.flatMap((events) =>
				events
					.filter((event) => event.status !== "CANCELLED")
					.map((event) => ({
						start_at: event.start.toISOString(),
						end_at: event.end.toISOString(),
					}))
					.filter((interval) => interval.end_at > interval.start_at),
			);

			const mergedIntervals = this.mergeBusyIntervals(intervals);
			this.rememberBusyIntervals(startAt, endAt, mergedIntervals);
			await this.updateSyncStatus("ok", null);
			return mergedIntervals;
		} catch (error) {
			console.error("Failed to fetch CalDAV busy intervals:", error);
			await this.updateSyncStatus(
				"error",
				error instanceof Error
					? error.message
					: t("general.caldavConnectionFailed"),
			);
			if (options.strict) {
				throw new Error(t("general.caldavConnectionFailed"));
			}

			return [];
		}
	}

	async hasBusyConflict(startAt: string, endAt: string): Promise<boolean> {
		const intervals = await this.getBusyIntervals(startAt, endAt, {
			strict: true,
		});

		return intervals.some(
			(interval) => !(interval.end_at <= startAt || interval.start_at >= endAt),
		);
	}

	async syncApprovedAppointment(
		appointment: AppointmentWithSlot,
		options: SyncAppointmentOptions = {},
	): Promise<CalDAVSyncMetadata> {
		const settings = await this.getPublicSettings();
		if (!settings.enabled) {
			throw new Error(t("general.caldavDisabled"));
		}

		const writableCalendarUrl = this.getWritableCalendarUrl(settings);
		try {
			const client = await this.createClient({});
			const eventPayload = this.buildAppointmentEventPayload(
				appointment,
				"CONFIRMED",
			);

			const metadata =
				appointment.caldav_href && appointment.caldav_uid
					? await this.putCalendarEvent(appointment, "CONFIRMED", options)
					: await client.createEvent(writableCalendarUrl, eventPayload);

			this.invalidateBusyIntervalCache();
			await this.updateSyncStatus("ok", null);
			if ("caldav_uid" in metadata) {
				return metadata;
			}
			return {
				caldav_uid: metadata.uid,
				caldav_calendar_url: writableCalendarUrl,
				caldav_href: metadata.href,
				caldav_etag: metadata.etag,
				caldav_last_synced_at: new Date().toISOString(),
				caldav_sync_error: null,
			};
		} catch (error) {
			await this.updateSyncStatus(
				"error",
				error instanceof Error
					? error.message
					: t("general.caldavConnectionFailed"),
			);
			throw error instanceof Error
				? error
				: new Error(t("general.caldavConnectionFailed"));
		}
	}

	async syncCanceledAppointment(
		appointment: AppointmentWithSlot,
		options: SyncAppointmentOptions = {},
	): Promise<CalDAVSyncMetadata | null> {
		if (!appointment.caldav_href || !appointment.caldav_uid) {
			return null;
		}

		try {
			const metadata = await this.putCalendarEvent(
				appointment,
				"CANCELLED",
				options,
			);

			this.invalidateBusyIntervalCache();
			await this.updateSyncStatus("ok", null);
			return metadata;
		} catch (error) {
			await this.updateSyncStatus(
				"error",
				error instanceof Error
					? error.message
					: t("general.caldavConnectionFailed"),
			);
			throw error instanceof Error
				? error
				: new Error(t("general.caldavConnectionFailed"));
		}
	}

	async deleteAppointmentFromCalendar(
		appointment: AppointmentWithSlot,
		options: SyncAppointmentOptions = {},
	): Promise<void> {
		if (!appointment.caldav_uid) {
			return;
		}

		try {
			if (appointment.caldav_href) {
				const credentials = await this.buildResolvedCredentials({});
				const eventUrl = new URL(
					appointment.caldav_href,
					`${credentials.base_url}/`,
				).toString();
				const headers: Record<string, string> = {
					Authorization: this.buildBasicAuthHeader(credentials),
				};
				if (!options.ignore_etag && appointment.caldav_etag) {
					headers.IfMatch = appointment.caldav_etag;
				}
				const response = await fetch(eventUrl, {
					method: "DELETE",
					headers,
				});
				if (!response.ok && response.status !== 404) {
					if (response.status === 412) {
						throw new CalDAVConflictError({
							message: t("general.caldavEtagConflict"),
							localEtag: appointment.caldav_etag || null,
							remoteEtag:
								response.headers.get("etag") ||
								(await this.getRemoteETagByHref(
									appointment.caldav_href,
									credentials,
								)),
							href: appointment.caldav_href,
						});
					}

					throw new Error(t("general.caldavConnectionFailed"));
				}
			} else {
				const client = await this.createClient({});
				const calendarUrl =
					appointment.caldav_calendar_url ||
					this.getWritableCalendarUrl(await this.getPublicSettings());
				await client.deleteEvent(
					calendarUrl,
					appointment.caldav_uid,
					options.ignore_etag
						? undefined
						: appointment.caldav_etag || undefined,
				);
			}
			this.invalidateBusyIntervalCache();
			await this.updateSyncStatus("ok", null);
		} catch (error) {
			await this.updateSyncStatus(
				"error",
				error instanceof Error
					? error.message
					: t("general.caldavConnectionFailed"),
			);
			throw error instanceof Error
				? error
				: new Error(t("general.caldavConnectionFailed"));
		}
	}

	async refreshAppointmentETag(
		appointment: AppointmentWithSlot,
	): Promise<string | null> {
		if (!appointment.caldav_href) {
			return null;
		}

		const credentials = await this.buildResolvedCredentials({});
		return this.getRemoteETagByHref(appointment.caldav_href, credentials);
	}

	async updateSettings(
		input: UpdateCalDAVSettingsInput,
	): Promise<CalDAVSettingsWithCalendars> {
		const currentSettings = await this.getPublicSettings();
		const nextEnabled =
			typeof input.enabled === "boolean"
				? input.enabled
				: currentSettings.enabled;
		const nextBaseUrl = normalizeBaseUrl(
			input.base_url ?? currentSettings.base_url,
		);
		const nextUsername = (input.username ?? currentSettings.username).trim();
		const nextWritableCalendarUrl = (
			input.writable_calendar_url ?? currentSettings.writable_calendar_url
		).trim();

		if (nextEnabled) {
			const calendars = await this.discoverCalendars({
				base_url: nextBaseUrl,
				username: nextUsername,
				password: input.password,
			});

			if (
				nextWritableCalendarUrl.length > 0 &&
				!calendars.some((calendar) => calendar.url === nextWritableCalendarUrl)
			) {
				throw new Error(t("general.caldavWritableCalendarInvalid"));
			}
		}

		await this.settingsRepo.set(
			CALDAV_SETTING_KEYS.enabled,
			nextEnabled ? "true" : "false",
		);
		await this.settingsRepo.set(CALDAV_SETTING_KEYS.baseUrl, nextBaseUrl);
		await this.settingsRepo.set(CALDAV_SETTING_KEYS.username, nextUsername);
		await this.settingsRepo.set(
			CALDAV_SETTING_KEYS.writableCalendarUrl,
			nextWritableCalendarUrl,
		);
		await this.settingsRepo.set(
			CALDAV_SETTING_KEYS.defaultSyncPolicy,
			normalizeCalDAVSyncPolicy(
				input.default_sync_policy ?? currentSettings.default_sync_policy,
			),
		);

		if (typeof input.password === "string" && input.password.length > 0) {
			await this.settingsRepo.set(
				CALDAV_SETTING_KEYS.password,
				await this.encryptSecret(input.password),
			);
		}

		this.invalidateBusyIntervalCache();
		this.invalidateClientCache();

		return this.getSettingsWithCalendars();
	}
}
