import { setLanguage, t } from "../../i18n";
import { SettingsRepository } from "../../repositories/SettingsRepository";
import { CalDAVService } from "../../services/CalDAVService";
import { CalDAVSyncService } from "../../services/CalDAVSyncService";
import {
	isValidWebhookUrl,
	isWebhookInboundScope,
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
	const caldavService = new CalDAVService();
	const caldavSyncService = new CalDAVSyncService();

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

	if (pathname === "/api/admin/settings/caldav" && method === "GET") {
		const data = await caldavSyncService.getAdminSettings();
		return jsonResponse(200, { success: true, data }, corsHeaders);
	}

	if (pathname === "/api/admin/settings/caldav/health" && method === "GET") {
		const data = await caldavSyncService.getHealthSnapshot();
		return jsonResponse(200, { success: true, data }, corsHeaders);
	}

	if (pathname === "/api/admin/settings/caldav/queue" && method === "GET") {
		const limitParam = new URL(args.request.url).searchParams.get("limit");
		const limit = Number.parseInt(limitParam || "50", 10);
		const data = await caldavSyncService.getQueueSnapshot(
			Number.isFinite(limit) && limit > 0 ? limit : 50,
		);
		return jsonResponse(200, { success: true, data }, corsHeaders);
	}

	if (pathname === "/api/admin/settings/caldav/policy" && method === "GET") {
		const data = {
			default_sync_policy: await caldavService.getDefaultSyncPolicy(),
		};
		return jsonResponse(200, { success: true, data }, corsHeaders);
	}

	if (pathname === "/api/admin/settings/caldav/policy" && method === "PUT") {
		const body = await parseJsonBody<{
			default_sync_policy?: string;
		}>(args.request);

		if (
			body.default_sync_policy !== "one_way_write" &&
			body.default_sync_policy !== "read_only_busy" &&
			body.default_sync_policy !== "two_way_guarded"
		) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidRequest") },
				corsHeaders,
			);
		}

		const data = await caldavService.updateDefaultSyncPolicy(
			body.default_sync_policy,
		);
		return jsonResponse(200, { success: true, data }, corsHeaders);
	}

	if (
		pathname === "/api/admin/settings/caldav/queue/retry" &&
		method === "POST"
	) {
		const body = await parseJsonBody<{ slug_id?: string }>(args.request);
		const slugId = body.slug_id?.trim();
		if (!slugId) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidRequest") },
				corsHeaders,
			);
		}

		const data = await caldavSyncService.retryAppointmentBySlugId(slugId);
		if (!data.appointment) {
			return jsonResponse(
				404,
				{ success: false, error: t("appointment.notFound") },
				corsHeaders,
			);
		}

		return jsonResponse(200, { success: true, data }, corsHeaders);
	}

	if (
		pathname === "/api/admin/settings/caldav/queue/repair" &&
		method === "POST"
	) {
		const body = await parseJsonBody<{
			slug_id?: string;
			action?: string;
		}>(args.request);
		const slugId = body.slug_id?.trim();
		if (!slugId) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidRequest") },
				corsHeaders,
			);
		}

		if (
			body.action !== "retry" &&
			body.action !== "refresh_etag" &&
			body.action !== "force_overwrite"
		) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidRequest") },
				corsHeaders,
			);
		}

		const data = await caldavSyncService.repairAppointmentBySlugId(
			slugId,
			body.action,
		);
		if (!data.appointment) {
			return jsonResponse(
				404,
				{ success: false, error: t("appointment.notFound") },
				corsHeaders,
			);
		}

		return jsonResponse(200, { success: true, data }, corsHeaders);
	}

	if (pathname === "/api/admin/settings/caldav/test" && method === "POST") {
		const body = await parseJsonBody<{
			base_url?: string;
			username?: string;
			password?: string;
		}>(args.request);

		const calendars = await caldavService.discoverCalendars(body);
		return jsonResponse(
			200,
			{ success: true, data: { calendars } },
			corsHeaders,
		);
	}

	if (pathname === "/api/admin/settings/caldav" && method === "PUT") {
		const body = await parseJsonBody<{
			enabled?: boolean;
			base_url?: string;
			username?: string;
			password?: string;
			writable_calendar_url?: string;
			default_sync_policy?:
				| "one_way_write"
				| "read_only_busy"
				| "two_way_guarded";
		}>(args.request);

		await caldavService.updateSettings(body);
		const data = await caldavSyncService.getAdminSettings();
		return jsonResponse(200, { success: true, data }, corsHeaders);
	}

	if (pathname === "/api/admin/settings/caldav/sync" && method === "POST") {
		const result = await caldavSyncService.runSync();
		const snapshot = await caldavSyncService.getHealthSnapshot();
		return jsonResponse(
			200,
			{ success: true, data: { result, snapshot } },
			corsHeaders,
		);
	}

	if (pathname === "/api/admin/settings/webhook" && method === "GET") {
		const data = await webhookService.getPublicSettings();
		return jsonResponse(200, { success: true, data }, corsHeaders);
	}

	if (pathname === "/api/admin/settings/webhook/secret" && method === "GET") {
		const target = new URL(args.request.url).searchParams.get("target");
		if (target !== "outbound" && target !== "inbound") {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidRequest") },
				corsHeaders,
			);
		}

		const secret = await webhookService.getSecret(target);
		return jsonResponse(200, { success: true, data: { secret } }, corsHeaders);
	}

	if (pathname === "/api/admin/settings/webhook" && method === "PUT") {
		const body = await parseJsonBody<{
			outbound?: {
				enabled?: boolean;
				url?: string;
				secret?: string;
			};
			inbound?: {
				enabled?: boolean;
				secret?: string;
				scopes?: string[];
			};
		}>(args.request);

		if (!body.outbound && !body.inbound) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidRequest") },
				corsHeaders,
			);
		}

		const current = await webhookService.getPublicSettings();
		const outboundEnabled =
			typeof body.outbound?.enabled === "boolean"
				? body.outbound.enabled
				: current.outbound.enabled;
		const outboundUrl =
			typeof body.outbound?.url === "string"
				? body.outbound.url.trim()
				: current.outbound.url;
		const outboundSecret =
			typeof body.outbound?.secret === "string"
				? body.outbound.secret.trim()
				: "";
		const willClearOutboundSecret =
			typeof body.outbound?.secret === "string" && outboundSecret.length === 0;

		if (outboundUrl.length > 0 && !isValidWebhookUrl(outboundUrl)) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidWebhookUrl") },
				corsHeaders,
			);
		}

		if (
			outboundSecret.length > 0 &&
			!webhookService.isSecretStrong(outboundSecret)
		) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.webhookSecretTooShort") },
				corsHeaders,
			);
		}

		const hasOutboundSecretAfterUpdate =
			outboundSecret.length > 0 ||
			(current.outbound.has_secret && !willClearOutboundSecret);

		if (outboundEnabled && (!outboundUrl || !hasOutboundSecretAfterUpdate)) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.webhookRequiresUrlAndSecret") },
				corsHeaders,
			);
		}

		const inboundEnabled =
			typeof body.inbound?.enabled === "boolean"
				? body.inbound.enabled
				: current.inbound.enabled;
		const inboundSecret =
			typeof body.inbound?.secret === "string"
				? body.inbound.secret.trim()
				: "";
		const willClearInboundSecret =
			typeof body.inbound?.secret === "string" && inboundSecret.length === 0;
		const inboundScopes = Array.isArray(body.inbound?.scopes)
			? [...new Set(body.inbound.scopes)]
			: current.inbound.scopes;

		if (
			inboundSecret.length > 0 &&
			!webhookService.isSecretStrong(inboundSecret)
		) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.webhookSecretTooShort") },
				corsHeaders,
			);
		}

		if (!inboundScopes.every((scope) => isWebhookInboundScope(scope))) {
			return jsonResponse(
				400,
				{ success: false, error: t("general.invalidWebhookScope") },
				corsHeaders,
			);
		}

		const hasInboundSecretAfterUpdate =
			inboundSecret.length > 0 ||
			(current.inbound.has_secret && !willClearInboundSecret);

		if (
			inboundEnabled &&
			(!hasInboundSecretAfterUpdate || inboundScopes.length === 0)
		) {
			return jsonResponse(
				400,
				{
					success: false,
					error: t("general.webhookInboundRequiresSecretAndScopes"),
				},
				corsHeaders,
			);
		}

		const data = await webhookService.updateSettings({
			outbound: body.outbound
				? {
						enabled: body.outbound.enabled,
						url: outboundUrl,
						secret: outboundSecret,
						clearSecret: willClearOutboundSecret,
					}
				: undefined,
			inbound: body.inbound
				? {
						enabled: body.inbound.enabled,
						secret: inboundSecret,
						clearSecret: willClearInboundSecret,
						scopes: inboundScopes.filter((scope) =>
							isWebhookInboundScope(scope),
						),
					}
				: undefined,
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
