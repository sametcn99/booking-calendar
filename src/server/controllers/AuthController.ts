import { t } from "../i18n";
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

	async login(
		body: {
			username?: string;
			password?: string;
		},
		clientKey = "unknown",
	): Promise<{ status: number; body: ApiResponse }> {
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
					token: loginResult.token,
					must_change_password: loginResult.mustChangePassword,
				},
			},
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
