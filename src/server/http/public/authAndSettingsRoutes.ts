import { getLanguage } from "../../i18n";
import { SettingsRepository } from "../../repositories/SettingsRepository";
import { parseThemeColorsFromUnknown } from "../../theme/appColors";
import type { PublicRouteHandler } from "../types";
import {
	jsonResponse,
	parseJsonBody,
	THEME_COLORS_SETTING_KEY,
} from "../utils";

export const handlePublicAuthAndSettingsRoutes: PublicRouteHandler = async (
	args,
) => {
	const { pathname, method, corsHeaders } = args;

	if (pathname === "/api/auth/login" && method === "POST") {
		const body = await parseJsonBody<{
			username?: string;
			password?: string;
		}>(args.request);
		const result = await args.authController.login(body, args.clientIp);
		return jsonResponse(result.status, result.body, {
			...corsHeaders,
			...(result.headers || {}),
		});
	}

	if (pathname === "/api/auth/refresh" && method === "POST") {
		const result = await args.authController.refresh(args.request);
		return jsonResponse(result.status, result.body, {
			...corsHeaders,
			...(result.headers || {}),
		});
	}

	if (pathname === "/api/auth/session" && method === "GET") {
		const result = await args.authController.session(args.request);
		return jsonResponse(result.status, result.body, {
			...corsHeaders,
			...(result.headers || {}),
		});
	}

	if (pathname === "/api/auth/logout" && method === "POST") {
		const result = await args.authController.logout();
		return jsonResponse(result.status, result.body, {
			...corsHeaders,
			...(result.headers || {}),
		});
	}

	if (pathname === "/api/settings/language" && method === "GET") {
		return jsonResponse(
			200,
			{ success: true, data: { language: getLanguage() } },
			corsHeaders,
		);
	}

	if (pathname === "/api/settings/theme-colors" && method === "GET") {
		const settingsRepo = new SettingsRepository();
		const saved = await settingsRepo.get(THEME_COLORS_SETTING_KEY);
		if (!saved) {
			return jsonResponse(
				200,
				{ success: true, data: { colors: null } },
				corsHeaders,
			);
		}

		try {
			const parsed = parseThemeColorsFromUnknown(JSON.parse(saved));
			return jsonResponse(
				200,
				{ success: true, data: { colors: parsed } },
				corsHeaders,
			);
		} catch {
			return jsonResponse(
				200,
				{ success: true, data: { colors: null } },
				corsHeaders,
			);
		}
	}

	if (pathname === "/api/settings/version" && method === "GET") {
		const result = await args.versionController.getVersionInfo();
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	return null;
};
