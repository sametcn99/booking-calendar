import { t } from "../i18n";

export const THEME_COLORS_SETTING_KEY = "theme_colors";

export const robotsHeaderValue =
	"noindex, nofollow, noarchive, nosnippet, noimageindex";

const mimeTypes: Record<string, string> = {
	".html": "text/html",
	".js": "application/javascript",
	".css": "text/css",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".webmanifest": "application/manifest+json",
};

export function getMimeType(path: string): string {
	const ext = path.slice(path.lastIndexOf("."));
	return mimeTypes[ext] || "application/octet-stream";
}

export function jsonResponse(
	status: number,
	body: unknown,
	headers: Record<string, string> = {},
): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json",
			"X-Robots-Tag": robotsHeaderValue,
			...headers,
		},
	});
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
	try {
		return (await request.json()) as T;
	} catch {
		return {} as T;
	}
}

export type RequestIpServer = {
	requestIP: (request: Request) => { address?: string } | null | undefined;
};

export function getClientIp(request: Request, server: RequestIpServer): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}
	return server.requestIP(request)?.address || "unknown";
}

export function extractPathParam(
	pathname: string,
	pattern: string,
): string | null {
	const patternParts = pattern.split("/");
	const pathParts = pathname.split("/");
	if (patternParts.length !== pathParts.length) return null;

	for (let i = 0; i < patternParts.length; i++) {
		if (patternParts[i].startsWith(":")) {
			return pathParts[i];
		}
		if (patternParts[i] !== pathParts[i]) return null;
	}
	return null;
}

export function extractRequiredPathParam(
	pathname: string,
	pattern: string,
): string | null {
	return extractPathParam(pathname, pattern);
}

export function matchRoute(pathname: string, pattern: string): boolean {
	const patternParts = pattern.split("/");
	const pathParts = pathname.split("/");
	if (patternParts.length !== pathParts.length) return false;

	for (let i = 0; i < patternParts.length; i++) {
		if (patternParts[i].startsWith(":")) continue;
		if (patternParts[i] !== pathParts[i]) return false;
	}
	return true;
}

export function invalidRouteResponse(
	corsHeaders: Record<string, string>,
): Response {
	return jsonResponse(
		400,
		{ success: false, error: t("general.invalidRoute") },
		corsHeaders,
	);
}
