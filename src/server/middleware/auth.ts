import { config } from "../config";
import { AuthService } from "../services/AuthService";

const authService = new AuthService();

function parseCookies(cookieHeader: string | null): Map<string, string> {
	const map = new Map<string, string>();
	if (!cookieHeader) return map;

	for (const part of cookieHeader.split(";")) {
		const [rawKey, ...rawValue] = part.trim().split("=");
		if (!rawKey || rawValue.length === 0) continue;
		map.set(rawKey, decodeURIComponent(rawValue.join("=")));
	}

	return map;
}

export async function extractToken(request: Request): Promise<string | null> {
	const authHeader = request.headers.get("authorization");
	if (authHeader) {
		const parts = authHeader.split(" ");
		if (parts.length === 2 && parts[0] === "Bearer" && parts[1].trim()) {
			return parts[1].trim();
		}
	}

	const cookies = parseCookies(request.headers.get("cookie"));
	const accessToken = cookies.get(config.authCookies.accessTokenName);
	return accessToken?.trim() ? accessToken.trim() : null;
}

export function extractRefreshToken(request: Request): string | null {
	const cookies = parseCookies(request.headers.get("cookie"));
	const refreshToken = cookies.get(config.authCookies.refreshTokenName);
	return refreshToken?.trim() ? refreshToken.trim() : null;
}

export async function getAuthenticatedUser(
	request: Request,
): Promise<{ username: string; role: "admin" } | null> {
	const token = await extractToken(request);
	if (!token) return null;

	const payload = await authService.verifyToken(token);
	if (!payload) return null;

	return {
		username: payload.sub,
		role: payload.role,
	};
}

export async function isAuthenticated(request: Request): Promise<boolean> {
	const user = await getAuthenticatedUser(request);
	return !!user;
}
