import { AuthService } from "../services/AuthService";

const authService = new AuthService();

export async function extractToken(request: Request): Promise<string | null> {
	const authHeader = request.headers.get("authorization");
	if (!authHeader) {
		return null;
	}

	const parts = authHeader.split(" ");
	if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1].trim()) {
		return null;
	}

	return parts[1].trim();
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
