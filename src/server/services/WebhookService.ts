import { createHmac, randomUUID } from "node:crypto";
import { SettingsRepository } from "../repositories/SettingsRepository";

const WEBHOOK_ENABLED_SETTING_KEY = "webhook_notifications_enabled";
const WEBHOOK_URL_SETTING_KEY = "webhook_url";
const WEBHOOK_SECRET_SETTING_KEY = "webhook_secret";

const MIN_SECRET_LENGTH = 16;
const DELIVERY_TIMEOUT_MS = 5000;
const MAX_RETRY_COUNT = 2;

interface WebhookDeliverySettings {
	enabled: boolean;
	url: string;
	secret: string;
}

export interface WebhookPublicSettings {
	enabled: boolean;
	url: string;
	has_secret: boolean;
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

export class WebhookService {
	private settingsRepo = new SettingsRepository();

	async getPublicSettings(): Promise<WebhookPublicSettings> {
		const [enabledRaw, urlRaw, secretRaw] = await Promise.all([
			this.settingsRepo.get(WEBHOOK_ENABLED_SETTING_KEY),
			this.settingsRepo.get(WEBHOOK_URL_SETTING_KEY),
			this.settingsRepo.get(WEBHOOK_SECRET_SETTING_KEY),
		]);

		return {
			enabled: enabledRaw === "true",
			url: urlRaw?.trim() ?? "",
			has_secret: Boolean(secretRaw && secretRaw.trim().length > 0),
		};
	}

	async updateSettings(input: {
		enabled?: boolean;
		url?: string;
		secret?: string;
		clearSecret?: boolean;
	}): Promise<WebhookPublicSettings> {
		if (typeof input.enabled === "boolean") {
			await this.settingsRepo.set(
				WEBHOOK_ENABLED_SETTING_KEY,
				input.enabled ? "true" : "false",
			);
		}

		if (typeof input.url === "string") {
			await this.settingsRepo.set(WEBHOOK_URL_SETTING_KEY, input.url.trim());
		}

		if (input.clearSecret) {
			await this.settingsRepo.delete(WEBHOOK_SECRET_SETTING_KEY);
		} else if (typeof input.secret === "string" && input.secret.length > 0) {
			await this.settingsRepo.set(WEBHOOK_SECRET_SETTING_KEY, input.secret);
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
						"X-BookingCalendar-Timestamp": timestamp,
						"X-BookingCalendar-Signature": `sha256=${signature}`,
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
}
