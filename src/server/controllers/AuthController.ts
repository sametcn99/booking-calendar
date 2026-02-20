import { config } from "../config";
import { t } from "../i18n";
import { extractRefreshToken, extractToken } from "../middleware/auth";
import { AuthService } from "../services/AuthService";
import type { ApiResponse } from "../types";

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return t("error.unexpected");
}

export class AuthController {
	private authService: AuthService;
	private loginAttempts: Map<
		string,
		{ count: number; blockedUntil: number; lastAttemptAt: number }
	>;
	private readonly maxFailedAttempts = 5;
	private readonly blockDurationMs = 5 * 60 * 1000;
	private readonly attemptWindowMs = 10 * 60 * 1000;
	private readonly accessCookieName = config.authCookies.accessTokenName;
	private readonly refreshCookieName = config.authCookies.refreshTokenName;

	constructor() {
		this.authService = new AuthService();
		this.loginAttempts = new Map();
	}

	private keyForAttempt(clientKey: string, username: string): string {
		return `${clientKey}:${username}`;
	}

	private getAttemptState(key: string) {
		const now = Date.now();
		const state = this.loginAttempts.get(key);
		if (!state) return null;

		if (
			now - state.lastAttemptAt > this.attemptWindowMs &&
			state.blockedUntil <= now
		) {
			this.loginAttempts.delete(key);
			return null;
		}

		return state;
	}

	private recordFailedAttempt(key: string): void {
		const now = Date.now();
		const current = this.getAttemptState(key);
		const count = (current?.count || 0) + 1;
		const blockedUntil =
			count >= this.maxFailedAttempts ? now + this.blockDurationMs : 0;

		this.loginAttempts.set(key, {
			count,
			blockedUntil,
			lastAttemptAt: now,
		});
	}

	private clearAttemptState(key: string): void {
		this.loginAttempts.delete(key);
	}

	private createCookie(
		name: string,
		value: string,
		maxAgeSeconds: number,
		httpOnly: boolean,
	): string {
		const parts = [
			`${name}=${encodeURIComponent(value)}`,
			`Path=${config.authCookies.path}`,
			`Max-Age=${maxAgeSeconds}`,
			`SameSite=${config.authCookies.sameSite}`,
		];

		if (config.authCookies.domain) {
			parts.push(`Domain=${config.authCookies.domain}`);
		}

		if (httpOnly) {
			parts.push("HttpOnly");
		}

		if (config.authCookies.secure) {
			parts.push("Secure");
		}

		return parts.join("; ");
	}

	private clearCookie(name: string, httpOnly: boolean): string {
		const parts = [
			`${name}=`,
			`Path=${config.authCookies.path}`,
			"Max-Age=0",
			"Expires=Thu, 01 Jan 1970 00:00:00 GMT",
			`SameSite=${config.authCookies.sameSite}`,
		];

		if (config.authCookies.domain) {
			parts.push(`Domain=${config.authCookies.domain}`);
		}

		if (httpOnly) {
			parts.push("HttpOnly");
		}

		if (config.authCookies.secure) {
			parts.push("Secure");
		}

		return parts.join("; ");
	}

	private createAuthCookieHeaders(
		accessToken: string,
		refreshToken: string,
	): Record<string, string | string[]> {
		return {
			"Cache-Control": "no-store",
			Pragma: "no-cache",
			"Set-Cookie": [
				this.createCookie(
					this.accessCookieName,
					accessToken,
					config.jwt.accessExpiresInSeconds,
					true,
				),
				this.createCookie(
					this.refreshCookieName,
					refreshToken,
					config.jwt.refreshExpiresInSeconds,
					true,
				),
			],
		};
	}

	private createClearAuthCookieHeaders(): Record<string, string | string[]> {
		return {
			"Cache-Control": "no-store",
			Pragma: "no-cache",
			"Set-Cookie": [
				this.clearCookie(this.accessCookieName, true),
				this.clearCookie(this.refreshCookieName, true),
			],
		};
	}

	async login(
		body: {
			username?: string;
			password?: string;
		},
		clientKey = "unknown",
	): Promise<{
		status: number;
		body: ApiResponse;
		headers?: Record<string, string | string[]>;
	}> {
		const username = body.username?.trim();
		const password = body.password;

		if (!username || !password) {
			return {
				status: 400,
				body: { success: false, error: t("auth.usernamePasswordRequired") },
			};
		}

		const attemptKey = this.keyForAttempt(clientKey, username);
		const attemptState = this.getAttemptState(attemptKey);
		if (attemptState?.blockedUntil && attemptState.blockedUntil > Date.now()) {
			return {
				status: 429,
				body: {
					success: false,
					error: t("auth.tooManyAttempts"),
				},
			};
		}

		const loginResult = await this.authService.login(username, password);
		if (!loginResult) {
			this.recordFailedAttempt(attemptKey);
			return {
				status: 401,
				body: { success: false, error: t("auth.invalidCredentials") },
			};
		}

		this.clearAttemptState(attemptKey);

		return {
			status: 200,
			body: {
				success: true,
				data: {
					must_change_password: loginResult.mustChangePassword,
				},
			},
			headers: this.createAuthCookieHeaders(
				loginResult.accessToken,
				loginResult.refreshToken,
			),
		};
	}

	async refresh(request: Request): Promise<{
		status: number;
		body: ApiResponse;
		headers?: Record<string, string | string[]>;
	}> {
		const refreshToken = extractRefreshToken(request);
		if (!refreshToken) {
			return {
				status: 401,
				body: { success: false, error: t("general.unauthorized") },
				headers: this.createClearAuthCookieHeaders(),
			};
		}

		const payload = await this.authService.verifyRefreshToken(refreshToken);
		if (!payload) {
			return {
				status: 401,
				body: { success: false, error: t("general.unauthorized") },
				headers: this.createClearAuthCookieHeaders(),
			};
		}

		const accessToken = await this.authService.createAccessToken(payload.sub);
		const newRefreshToken = await this.authService.createRefreshToken(
			payload.sub,
		);
		const mustChangePassword = await this.authService.getMustChangePassword(
			payload.sub,
		);

		return {
			status: 200,
			body: {
				success: true,
				data: {
					must_change_password: mustChangePassword,
				},
			},
			headers: this.createAuthCookieHeaders(accessToken, newRefreshToken),
		};
	}

	async session(request: Request): Promise<{
		status: number;
		body: ApiResponse;
		headers?: Record<string, string | string[]>;
	}> {
		const token = await extractToken(request);
		const payload = token ? await this.authService.verifyToken(token) : null;
		if (!payload) {
			const refreshToken = extractRefreshToken(request);
			if (!refreshToken) {
				return {
					status: 200,
					body: {
						success: true,
						data: { authenticated: false, must_change_password: false },
					},
				};
			}

			const refreshPayload =
				await this.authService.verifyRefreshToken(refreshToken);
			if (!refreshPayload) {
				return {
					status: 200,
					body: {
						success: true,
						data: { authenticated: false, must_change_password: false },
					},
					headers: this.createClearAuthCookieHeaders(),
				};
			}

			const accessToken = await this.authService.createAccessToken(
				refreshPayload.sub,
			);
			const newRefreshToken = await this.authService.createRefreshToken(
				refreshPayload.sub,
			);
			const mustChangePassword = await this.authService.getMustChangePassword(
				refreshPayload.sub,
			);

			return {
				status: 200,
				body: {
					success: true,
					data: {
						authenticated: true,
						must_change_password: mustChangePassword,
					},
				},
				headers: this.createAuthCookieHeaders(accessToken, newRefreshToken),
			};
		}

		const mustChangePassword = await this.authService.getMustChangePassword(
			payload.sub,
		);
		return {
			status: 200,
			body: {
				success: true,
				data: { authenticated: true, must_change_password: mustChangePassword },
			},
		};
	}

	async logout(): Promise<{
		status: number;
		body: ApiResponse;
		headers: Record<string, string | string[]>;
	}> {
		return {
			status: 200,
			body: { success: true, data: { logged_out: true } },
			headers: this.createClearAuthCookieHeaders(),
		};
	}

	async changePassword(
		username: string,
		body: {
			current_password?: string;
			new_password?: string;
		},
	): Promise<{ status: number; body: ApiResponse }> {
		const currentPassword = body.current_password;
		const newPassword = body.new_password?.trim();

		if (!currentPassword || !newPassword) {
			return {
				status: 400,
				body: {
					success: false,
					error: t("auth.passwordFieldsRequired"),
				},
			};
		}

		if (newPassword.length < 10) {
			return {
				status: 400,
				body: {
					success: false,
					error: t("auth.passwordMinLength"),
				},
			};
		}

		const hasLower = /[a-z]/.test(newPassword);
		const hasUpper = /[A-Z]/.test(newPassword);
		const hasDigit = /\d/.test(newPassword);
		if (!hasLower || !hasUpper || !hasDigit) {
			return {
				status: 400,
				body: {
					success: false,
					error: t("auth.passwordComplexity"),
				},
			};
		}

		try {
			await this.authService.changePassword(
				username,
				currentPassword,
				newPassword,
			);
			return {
				status: 200,
				body: { success: true, data: { changed: true } },
			};
		} catch (error: unknown) {
			const message = getErrorMessage(error);
			const status =
				message.includes("incorrect") ||
				message.includes("different") ||
				message.includes("Unauthorized")
					? 400
					: 500;
			return {
				status,
				body: { success: false, error: message },
			};
		}
	}
}
