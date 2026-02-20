import { setLanguage, t } from "../../i18n";
import { SettingsRepository } from "../../repositories/SettingsRepository";
import {
	isValidWebhookUrl,
	WebhookService,
} from "../../services/WebhookService";
import { parseThemeColorsFromUnknown } from "../../theme/appColors";
import type { AdminRouteHandler } from "../types";
import {
	jsonResponse,
	parseJsonBody,
	THEME_COLORS_SETTING_KEY,
} from "../utils";

export const handleAdminSettingsRoutes: AdminRouteHandler = async (args) => {
	const { pathname, method, corsHeaders } = args;
	const webhookService = new WebhookService();

	if (pathname === "/api/admin/settings/language" && method === "PUT") {
		const body = await parseJsonBody<{ language?: string }>(args.request);
		const lang = body.language;
		if (!lang || (lang !== "en" && lang !== "tr")) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidLanguage") },
				corsHeaders,
			);
		}
		const settingsRepo = new SettingsRepository();
		await settingsRepo.set("language", lang);
		setLanguage(lang);
		return jsonResponse(
			200,
			{ success: true, data: { language: lang } },
			corsHeaders,
		);
	}

	if (pathname === "/api/admin/settings/admin-email" && method === "GET") {
		const settingsRepo = new SettingsRepository();
		const savedEmail = await settingsRepo.get("admin_email");
		const email = savedEmail?.trim() ?? "";
		return jsonResponse(200, { success: true, data: { email } }, corsHeaders);
	}

	if (pathname === "/api/admin/settings/admin-email" && method === "PUT") {
		const body = await parseJsonBody<{ email?: string }>(args.request);
		const email = (body.email ?? "").trim();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (email.length > 0 && !emailRegex.test(email)) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidEmail") },
				corsHeaders,
			);
		}

		if (email.length > 0) {
			try {
				await args.mailService.verifyConnection();
			} catch (error) {
				console.error("SMTP verify failed while saving admin email:", error);
				return jsonResponse(
					400,
					{ success: false, error: t("general.smtpConnectionFailed") },
					corsHeaders,
				);
			}
		}

		const settingsRepo = new SettingsRepository();
		await settingsRepo.set("admin_email", email);
		return jsonResponse(200, { success: true, data: { email } }, corsHeaders);
	}

	if (pathname === "/api/admin/settings/calendar-sharing" && method === "GET") {
		const settingsRepo = new SettingsRepository();
		const value = await settingsRepo.get("calendar_sharing");
		return jsonResponse(
			200,
			{ success: true, data: { enabled: value === "true" } },
			corsHeaders,
		);
	}

	if (pathname === "/api/admin/settings/calendar-sharing" && method === "PUT") {
		const body = await parseJsonBody<{ enabled?: boolean }>(args.request);
		const settingsRepo = new SettingsRepository();
		await settingsRepo.set("calendar_sharing", body.enabled ? "true" : "false");
		return jsonResponse(
			200,
			{ success: true, data: { enabled: !!body.enabled } },
			corsHeaders,
		);
	}

	if (
		pathname === "/api/admin/settings/push-notifications" &&
		method === "GET"
	) {
		const settingsRepo = new SettingsRepository();
		const value = await settingsRepo.get("push_notifications_enabled");
		return jsonResponse(
			200,
			{ success: true, data: { enabled: value === "true" } },
			corsHeaders,
		);
	}

	if (
		pathname === "/api/admin/settings/push-notifications" &&
		method === "PUT"
	) {
		const body = await parseJsonBody<{ enabled?: boolean }>(args.request);
		const settingsRepo = new SettingsRepository();
		await settingsRepo.set(
			"push_notifications_enabled",
			body.enabled ? "true" : "false",
		);
		return jsonResponse(
			200,
			{ success: true, data: { enabled: !!body.enabled } },
			corsHeaders,
		);
	}

	if (
		pathname === "/api/admin/settings/email-notifications" &&
		method === "GET"
	) {
		const settingsRepo = new SettingsRepository();
		const value = await settingsRepo.get("email_notifications_enabled");
		return jsonResponse(
			200,
			{ success: true, data: { enabled: value === "true" } },
			corsHeaders,
		);
	}

	if (
		pathname === "/api/admin/settings/email-notifications" &&
		method === "PUT"
	) {
		const body = await parseJsonBody<{ enabled?: boolean }>(args.request);
		const settingsRepo = new SettingsRepository();

		if (body.enabled) {
			const adminEmail = (await settingsRepo.get("admin_email"))?.trim() ?? "";
			if (!adminEmail) {
				return jsonResponse(
					400,
					{
						success: false,
						error: t("general.adminEmailRequiredForEmailNotifications"),
					},
					corsHeaders,
				);
			}

			try {
				await args.mailService.verifyConnection();
			} catch (error) {
				console.error(
					"SMTP verify failed while enabling email notifications:",
					error,
				);
				return jsonResponse(
					400,
					{ success: false, error: t("general.smtpConnectionFailed") },
					corsHeaders,
				);
			}
		}

		await settingsRepo.set(
			"email_notifications_enabled",
			body.enabled ? "true" : "false",
		);
		return jsonResponse(
			200,
			{ success: true, data: { enabled: !!body.enabled } },
			corsHeaders,
		);
	}

	if (pathname === "/api/admin/settings/webhook" && method === "GET") {
		const data = await webhookService.getPublicSettings();
		return jsonResponse(200, { success: true, data }, corsHeaders);
	}

	if (pathname === "/api/admin/settings/webhook" && method === "PUT") {
		const body = await parseJsonBody<{
			enabled?: boolean;
			url?: string;
			secret?: string;
		}>(args.request);

		if (typeof body.enabled !== "boolean") {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidRequest") },
				corsHeaders,
			);
		}

		const current = await webhookService.getPublicSettings();
		const normalizedUrl =
			typeof body.url === "string" ? body.url.trim() : current.url;
		const normalizedSecret =
			typeof body.secret === "string" ? body.secret.trim() : "";
		const willClearSecret =
			typeof body.secret === "string" && normalizedSecret.length === 0;

		if (normalizedUrl.length > 0 && !isValidWebhookUrl(normalizedUrl)) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidWebhookUrl") },
				corsHeaders,
			);
		}

		if (
			normalizedSecret.length > 0 &&
			!webhookService.isSecretStrong(normalizedSecret)
		) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.webhookSecretTooShort") },
				corsHeaders,
			);
		}

		const hasSecretAfterUpdate =
			normalizedSecret.length > 0 || (current.has_secret && !willClearSecret);

		if (body.enabled && (!normalizedUrl || !hasSecretAfterUpdate)) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.webhookRequiresUrlAndSecret") },
				corsHeaders,
			);
		}

		const data = await webhookService.updateSettings({
			enabled: body.enabled,
			url: normalizedUrl,
			secret: normalizedSecret,
			clearSecret: willClearSecret,
		});

		return jsonResponse(200, { success: true, data }, corsHeaders);
	}

	if (pathname === "/api/admin/settings/webhook/test" && method === "POST") {
		const ready = await webhookService.isEnabledAndConfigured();
		if (!ready) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.webhookRequiresUrlAndSecret") },
				corsHeaders,
			);
		}

		await webhookService.sendEvent("webhook.test", {
			triggered_by: args.user.username,
			message: "Manual webhook test event",
		});

		return jsonResponse(
			200,
			{ success: true, data: { sent: true } },
			corsHeaders,
		);
	}

	if (pathname === "/api/admin/settings/theme-colors" && method === "PUT") {
		const body = await parseJsonBody<{ colors?: unknown }>(args.request);
		const colors = parseThemeColorsFromUnknown(body.colors);
		if (!colors) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidRequest") },
				corsHeaders,
			);
		}

		const settingsRepo = new SettingsRepository();
		await settingsRepo.set(THEME_COLORS_SETTING_KEY, JSON.stringify(colors));
		return jsonResponse(200, { success: true, data: { colors } }, corsHeaders);
	}

	if (pathname === "/api/admin/settings/theme-colors" && method === "DELETE") {
		const settingsRepo = new SettingsRepository();
		await settingsRepo.delete(THEME_COLORS_SETTING_KEY);
		return jsonResponse(
			200,
			{ success: true, data: { reset: true } },
			corsHeaders,
		);
	}

	return null;
};
