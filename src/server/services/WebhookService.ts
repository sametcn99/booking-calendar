import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { config } from "../config";
import { t } from "../i18n";
import { SettingsRepository } from "../repositories/SettingsRepository";

const WEBHOOK_ENABLED_SETTING_KEY = "webhook_notifications_enabled";
const WEBHOOK_URL_SETTING_KEY = "webhook_url";
const WEBHOOK_SECRET_SETTING_KEY = "webhook_secret";
const WEBHOOK_INBOUND_ENABLED_SETTING_KEY = "webhook_inbound_enabled";
const WEBHOOK_INBOUND_SECRET_SETTING_KEY = "webhook_inbound_secret";
const WEBHOOK_INBOUND_SCOPES_SETTING_KEY = "webhook_inbound_scopes";

const MIN_SECRET_LENGTH = 16;
const DELIVERY_TIMEOUT_MS = 5000;
const MAX_RETRY_COUNT = 2;
const MAX_INBOUND_SIGNATURE_AGE_SECONDS = 300;
const INBOUND_REPLAY_WINDOW_MS = 10 * 60 * 1000;

export const WEBHOOK_TIMESTAMP_HEADER = "X-BookingCalendar-Timestamp";
export const WEBHOOK_SIGNATURE_HEADER = "X-BookingCalendar-Signature";
export const WEBHOOK_REQUEST_ID_HEADER = "X-BookingCalendar-Request-Id";

export const WEBHOOK_INBOUND_SCOPE_OPTIONS = [
	"admin.slots",
	"admin.appointments",
	"admin.links",
	"admin.planner",
	"admin.community-events",
	"public.booking",
	"public.appointment",
	"public.community",
] as const;

export type WebhookInboundScope =
	(typeof WEBHOOK_INBOUND_SCOPE_OPTIONS)[number];

const WEBHOOK_SCOPE_ACTIONS: Record<WebhookInboundScope, readonly string[]> = {
	"admin.slots": [
		"admin.slots.list",
		"admin.slots.create",
		"admin.slots.toggle",
		"admin.slots.rename",
		"admin.slots.update",
		"admin.slots.delete",
	],
	"admin.appointments": [
		"admin.appointments.list",
		"admin.appointments.approve",
		"admin.appointments.reject",
		"admin.appointments.cancel",
		"admin.appointments.delete",
	],
	"admin.links": [
		"admin.links.list",
		"admin.links.create",
		"admin.links.update",
		"admin.links.delete",
	],
	"admin.planner": [
		"admin.planner.list",
		"admin.planner.create",
		"admin.planner.update",
		"admin.planner.delete",
	],
	"admin.community-events": [
		"admin.community-events.list",
		"admin.community-events.create",
		"admin.community-events.approve",
		"admin.community-events.delete",
	],
	"public.booking": [
		"public.booking.validate",
		"public.booking.slots",
		"public.booking.appointments.create",
	],
	"public.appointment": ["public.appointment.get", "public.appointment.cancel"],
	"public.community": ["public.community.get", "public.community.approve"],
};

const inboundReplayCache = new Map<string, number>();

interface WebhookDeliverySettings {
	enabled: boolean;
	url: string;
	secret: string;
}

interface WebhookInboundSettings {
	enabled: boolean;
	secret: string;
	scopes: WebhookInboundScope[];
}

export interface WebhookPublicSettings {
	outbound: {
		enabled: boolean;
		url: string;
		has_secret: boolean;
	};
	inbound: {
		enabled: boolean;
		endpoint: string;
		has_secret: boolean;
		scopes: WebhookInboundScope[];
	};
	supported_actions: string[];
}

interface WebhookEnvelope {
	event: string;
	delivery_id: string;
	occurred_at: string;
	source: "booking-calendar";
	data: unknown;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanupReplayCache(now = Date.now()): void {
	for (const [requestId, expiresAt] of inboundReplayCache.entries()) {
		if (expiresAt <= now) {
			inboundReplayCache.delete(requestId);
		}
	}
}

function compareSignature(expected: string, actual: string): boolean {
	const expectedBuffer = Buffer.from(expected, "utf8");
	const actualBuffer = Buffer.from(actual, "utf8");
	if (expectedBuffer.length !== actualBuffer.length) {
		return false;
	}
	return timingSafeEqual(expectedBuffer, actualBuffer);
}

function normalizeInboundScopes(
	raw: string | null | undefined,
): WebhookInboundScope[] {
	if (!raw) {
		return [];
	}

	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [];
		}

		return [...new Set(parsed)]
			.filter(
				(value): value is WebhookInboundScope =>
					typeof value === "string" && isWebhookInboundScope(value),
			)
			.sort();
	} catch {
		return [];
	}
}

export function isValidWebhookUrl(rawUrl: string): boolean {
	let parsed: URL;
	try {
		parsed = new URL(rawUrl);
	} catch {
		return false;
	}

	if (parsed.protocol === "https:") {
		return true;
	}

	if (parsed.protocol !== "http:") {
		return false;
	}

	const hostname = parsed.hostname.toLowerCase();
	return (
		hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
	);
}

export function isWebhookInboundScope(
	value: string,
): value is WebhookInboundScope {
	return WEBHOOK_INBOUND_SCOPE_OPTIONS.includes(value as WebhookInboundScope);
}

export function getWebhookSupportedActions(): string[] {
	return Object.values(WEBHOOK_SCOPE_ACTIONS).flat().sort();
}

export class WebhookService {
	private settingsRepo = new SettingsRepository();

	async getPublicSettings(): Promise<WebhookPublicSettings> {
		const [
			enabledRaw,
			urlRaw,
			secretRaw,
			inboundEnabledRaw,
			inboundSecretRaw,
			inboundScopesRaw,
		] = await Promise.all([
			this.settingsRepo.get(WEBHOOK_ENABLED_SETTING_KEY),
			this.settingsRepo.get(WEBHOOK_URL_SETTING_KEY),
			this.settingsRepo.get(WEBHOOK_SECRET_SETTING_KEY),
			this.settingsRepo.get(WEBHOOK_INBOUND_ENABLED_SETTING_KEY),
			this.settingsRepo.get(WEBHOOK_INBOUND_SECRET_SETTING_KEY),
			this.settingsRepo.get(WEBHOOK_INBOUND_SCOPES_SETTING_KEY),
		]);

		return {
			outbound: {
				enabled: enabledRaw === "true",
				url: urlRaw?.trim() ?? "",
				has_secret: Boolean(secretRaw && secretRaw.trim().length > 0),
			},
			inbound: {
				enabled: inboundEnabledRaw === "true",
				endpoint: `${config.baseUrl}/api/public/webhooks/inbound`,
				has_secret: Boolean(
					inboundSecretRaw && inboundSecretRaw.trim().length > 0,
				),
				scopes: normalizeInboundScopes(inboundScopesRaw),
			},
			supported_actions: getWebhookSupportedActions(),
		};
	}

	async updateSettings(input: {
		outbound?: {
			enabled?: boolean;
			url?: string;
			secret?: string;
			clearSecret?: boolean;
		};
		inbound?: {
			enabled?: boolean;
			secret?: string;
			clearSecret?: boolean;
			scopes?: WebhookInboundScope[];
		};
	}): Promise<WebhookPublicSettings> {
		if (input.outbound) {
			if (typeof input.outbound.enabled === "boolean") {
				await this.settingsRepo.set(
					WEBHOOK_ENABLED_SETTING_KEY,
					input.outbound.enabled ? "true" : "false",
				);
			}

			if (typeof input.outbound.url === "string") {
				await this.settingsRepo.set(
					WEBHOOK_URL_SETTING_KEY,
					input.outbound.url.trim(),
				);
			}

			if (input.outbound.clearSecret) {
				await this.settingsRepo.delete(WEBHOOK_SECRET_SETTING_KEY);
			} else if (
				typeof input.outbound.secret === "string" &&
				input.outbound.secret.length > 0
			) {
				await this.settingsRepo.set(
					WEBHOOK_SECRET_SETTING_KEY,
					input.outbound.secret,
				);
			}
		}

		if (input.inbound) {
			if (typeof input.inbound.enabled === "boolean") {
				await this.settingsRepo.set(
					WEBHOOK_INBOUND_ENABLED_SETTING_KEY,
					input.inbound.enabled ? "true" : "false",
				);
			}

			if (Array.isArray(input.inbound.scopes)) {
				await this.settingsRepo.set(
					WEBHOOK_INBOUND_SCOPES_SETTING_KEY,
					JSON.stringify([...new Set(input.inbound.scopes)].sort()),
				);
			}

			if (input.inbound.clearSecret) {
				await this.settingsRepo.delete(WEBHOOK_INBOUND_SECRET_SETTING_KEY);
			} else if (
				typeof input.inbound.secret === "string" &&
				input.inbound.secret.length > 0
			) {
				await this.settingsRepo.set(
					WEBHOOK_INBOUND_SECRET_SETTING_KEY,
					input.inbound.secret,
				);
			}
		}

		return this.getPublicSettings();
	}

	isSecretStrong(secret: string): boolean {
		return secret.trim().length >= MIN_SECRET_LENGTH;
	}

	async isEnabledAndConfigured(): Promise<boolean> {
		const settings = await this.getDeliverySettings();
		return settings !== null;
	}

	async isInboundEnabledAndConfigured(): Promise<boolean> {
		const settings = await this.getInboundSettings();
		return settings !== null;
	}

	isActionAllowed(action: string, scopes: WebhookInboundScope[]): boolean {
		return scopes.some((scope) =>
			WEBHOOK_SCOPE_ACTIONS[scope].includes(action),
		);
	}

	async verifyInboundRequest(
		headers: Headers,
		rawBody: string,
	): Promise<WebhookInboundSettings> {
		const settings = await this.getInboundSettings();
		if (!settings) {
			throw new Error(t("general.webhookInboundDisabled"));
		}

		const timestamp = headers.get(WEBHOOK_TIMESTAMP_HEADER)?.trim() ?? "";
		const signatureHeader = headers.get(WEBHOOK_SIGNATURE_HEADER)?.trim() ?? "";
		const requestId = headers.get(WEBHOOK_REQUEST_ID_HEADER)?.trim() ?? "";

		if (!timestamp || !signatureHeader || !requestId) {
			throw new Error(t("general.invalidWebhookSignature"));
		}

		const timestampSeconds = Number(timestamp);
		if (!Number.isFinite(timestampSeconds)) {
			throw new Error(t("general.invalidWebhookSignature"));
		}

		const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
		if (ageSeconds > MAX_INBOUND_SIGNATURE_AGE_SECONDS) {
			throw new Error(t("general.webhookTimestampExpired"));
		}

		cleanupReplayCache();
		if (inboundReplayCache.has(requestId)) {
			throw new Error(t("general.webhookReplayDetected"));
		}

		const expectedSignature = createHmac("sha256", settings.secret)
			.update(`${timestamp}.${rawBody}`)
			.digest("hex");
		const actualSignature = signatureHeader.startsWith("sha256=")
			? signatureHeader.slice("sha256=".length)
			: signatureHeader;

		if (!compareSignature(expectedSignature, actualSignature)) {
			throw new Error(t("general.invalidWebhookSignature"));
		}

		inboundReplayCache.set(requestId, Date.now() + INBOUND_REPLAY_WINDOW_MS);
		return settings;
	}

	async sendEvent(event: string, data: unknown): Promise<void> {
		const settings = await this.getDeliverySettings();
		if (!settings) {
			return;
		}

		const envelope: WebhookEnvelope = {
			event,
			delivery_id: randomUUID(),
			occurred_at: new Date().toISOString(),
			source: "booking-calendar",
			data,
		};

		const body = JSON.stringify(envelope);
		const timestamp = Math.floor(Date.now() / 1000).toString();
		const signature = createHmac("sha256", settings.secret)
			.update(`${timestamp}.${body}`)
			.digest("hex");

		for (let attempt = 0; attempt <= MAX_RETRY_COUNT; attempt++) {
			try {
				const response = await fetch(settings.url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"User-Agent": "booking-calendar-webhook/1.0",
						"X-BookingCalendar-Event": event,
						[WEBHOOK_TIMESTAMP_HEADER]: timestamp,
						[WEBHOOK_SIGNATURE_HEADER]: `sha256=${signature}`,
						[WEBHOOK_REQUEST_ID_HEADER]: envelope.delivery_id,
						"X-BookingCalendar-Delivery-Id": envelope.delivery_id,
					},
					body,
					signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
				});

				if (response.ok) {
					return;
				}

				if (
					response.status >= 400 &&
					response.status < 500 &&
					response.status !== 429
				) {
					console.error(
						`Webhook delivery failed with status ${response.status} (no retry)`,
					);
					return;
				}
			} catch (error) {
				if (attempt >= MAX_RETRY_COUNT) {
					console.error("Webhook delivery failed after retries:", error);
					return;
				}
			}

			if (attempt < MAX_RETRY_COUNT) {
				await sleep(300 * (attempt + 1));
			}
		}
	}

	private async getDeliverySettings(): Promise<WebhookDeliverySettings | null> {
		const [enabledRaw, urlRaw, secretRaw] = await Promise.all([
			this.settingsRepo.get(WEBHOOK_ENABLED_SETTING_KEY),
			this.settingsRepo.get(WEBHOOK_URL_SETTING_KEY),
			this.settingsRepo.get(WEBHOOK_SECRET_SETTING_KEY),
		]);

		if (enabledRaw !== "true") {
			return null;
		}

		const url = urlRaw?.trim() ?? "";
		const secret = secretRaw?.trim() ?? "";
		if (!url || !secret) {
			return null;
		}

		if (!isValidWebhookUrl(url)) {
			return null;
		}

		return {
			enabled: true,
			url,
			secret,
		};
	}

	private async getInboundSettings(): Promise<WebhookInboundSettings | null> {
		const [enabledRaw, secretRaw, scopesRaw] = await Promise.all([
			this.settingsRepo.get(WEBHOOK_INBOUND_ENABLED_SETTING_KEY),
			this.settingsRepo.get(WEBHOOK_INBOUND_SECRET_SETTING_KEY),
			this.settingsRepo.get(WEBHOOK_INBOUND_SCOPES_SETTING_KEY),
		]);

		if (enabledRaw !== "true") {
			return null;
		}

		const secret = secretRaw?.trim() ?? "";
		const scopes = normalizeInboundScopes(scopesRaw);
		if (!secret || scopes.length === 0) {
			return null;
		}

		return {
			enabled: true,
			secret,
			scopes,
		};
	}
}
