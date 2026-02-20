import { timingSafeEqual } from "node:crypto";
import { config } from "../config";
import { t } from "../i18n";
import { AdminCredentialRepository } from "../repositories/AdminCredentialRepository";

type AuthTokenPayload = {
	sub: string;
	role: "admin";
	token_type: "access" | "refresh";
	iat: number;
	nbf: number;
	exp: number;
	iss: string;
	aud: string;
};

export class AuthService {
	private credentialRepo: AdminCredentialRepository;

	constructor() {
		this.credentialRepo = new AdminCredentialRepository();
	}

	async login(
		username: string,
		password: string,
	): Promise<{
		accessToken: string;
		refreshToken: string;
		mustChangePassword: boolean;
	} | null> {
		if (username !== config.admin.username) {
			return null;
		}

		const credential = await this.ensureAdminCredential();
		const validPassword = await Bun.password.verify(
			password,
			credential.password_hash,
		);
		if (!validPassword) {
			return null;
		}

		const accessToken = await this.createAccessToken(username);
		const refreshToken = await this.createRefreshToken(username);
		return {
			accessToken,
			refreshToken,
			mustChangePassword: credential.is_default_password,
		};
	}

	async getMustChangePassword(username: string): Promise<boolean> {
		if (username !== config.admin.username) {
			return false;
		}
		const credential = await this.ensureAdminCredential();
		return credential.is_default_password;
	}

	async changePassword(
		username: string,
		currentPassword: string,
		newPassword: string,
	): Promise<void> {
		if (username !== config.admin.username) {
			throw new Error(t("auth.unauthorized"));
		}

		const credential = await this.ensureAdminCredential();
		const validCurrentPassword = await Bun.password.verify(
			currentPassword,
			credential.password_hash,
		);
		if (!validCurrentPassword) {
			throw new Error(t("auth.currentPasswordIncorrect"));
		}

		const samePassword = await Bun.password.verify(
			newPassword,
			credential.password_hash,
		);
		if (samePassword) {
			throw new Error(t("auth.passwordMustDiffer"));
		}

		const newHash = await Bun.password.hash(newPassword, {
			algorithm: "argon2id",
		});
		await this.credentialRepo.updatePassword(credential.id, newHash);
	}

	async verifyToken(token: string): Promise<AuthTokenPayload | null> {
		return this.verifyJwt(token, "access");
	}

	async verifyRefreshToken(token: string): Promise<AuthTokenPayload | null> {
		return this.verifyJwt(token, "refresh");
	}

	async createAccessToken(username: string): Promise<string> {
		return this.createToken({
			username,
			tokenType: "access",
			audience: "booking-calendar-admin",
			expiresInSeconds: config.jwt.accessExpiresInSeconds,
			secret: config.jwt.secret,
		});
	}

	async createRefreshToken(username: string): Promise<string> {
		return this.createToken({
			username,
			tokenType: "refresh",
			audience: "booking-calendar-admin-refresh",
			expiresInSeconds: config.jwt.refreshExpiresInSeconds,
			secret: config.jwt.refreshSecret,
		});
	}

	private async verifyJwt(
		token: string,
		expectedTokenType: "access" | "refresh",
	): Promise<AuthTokenPayload | null> {
		try {
			const parts = token.split(".");
			if (parts.length !== 3) return null;

			const [header, payload, signature] = parts;
			const secret =
				expectedTokenType === "access"
					? config.jwt.secret
					: config.jwt.refreshSecret;
			const expectedAudience =
				expectedTokenType === "access"
					? "booking-calendar-admin"
					: "booking-calendar-admin-refresh";
			const validSignature = await this.verifySignature(
				`${header}.${payload}`,
				signature,
				secret,
			);
			if (!validSignature) return null;

			const decodedHeader = JSON.parse(
				this.base64urlDecodeToString(header),
			) as { alg?: string; typ?: string };
			if (decodedHeader.alg !== "HS256" || decodedHeader.typ !== "JWT") {
				return null;
			}

			const decoded = JSON.parse(
				this.base64urlDecodeToString(payload),
			) as Partial<AuthTokenPayload>;
			const now = Math.floor(Date.now() / 1000);

			if (
				typeof decoded.sub !== "string" ||
				decoded.sub !== config.admin.username ||
				decoded.role !== "admin" ||
				decoded.token_type !== expectedTokenType ||
				typeof decoded.exp !== "number" ||
				typeof decoded.iat !== "number" ||
				typeof decoded.nbf !== "number" ||
				decoded.iss !== config.baseUrl ||
				decoded.aud !== expectedAudience
			) {
				return null;
			}

			if (decoded.exp <= now || decoded.nbf > now) {
				return null;
			}

			return decoded as AuthTokenPayload;
		} catch {
			return null;
		}
	}

	private async ensureAdminCredential() {
		const existing = await this.credentialRepo.findByUsername(
			config.admin.username,
		);
		if (existing) {
			return existing;
		}

		const defaultHash = await Bun.password.hash(config.admin.password, {
			algorithm: "argon2id",
		});
		return this.credentialRepo.create(config.admin.username, defaultHash);
	}

	private async createToken(input: {
		username: string;
		tokenType: "access" | "refresh";
		audience: string;
		expiresInSeconds: number;
		secret: string;
	}): Promise<string> {
		const now = Math.floor(Date.now() / 1000);
		const header = this.base64urlEncodeString(
			JSON.stringify({ alg: "HS256", typ: "JWT" }),
		);
		const payload = this.base64urlEncodeString(
			JSON.stringify({
				sub: input.username,
				role: "admin",
				token_type: input.tokenType,
				iat: now,
				nbf: now,
				exp: now + input.expiresInSeconds,
				iss: config.baseUrl,
				aud: input.audience,
			}),
		);

		const signature = await this.sign(`${header}.${payload}`, input.secret);
		return `${header}.${payload}.${signature}`;
	}

	private async sign(data: string, secret: string): Promise<string> {
		const signature = await this.signRaw(data, secret);
		return this.base64urlEncodeBytes(new Uint8Array(signature));
	}

	private async signRaw(data: string, secret: string): Promise<ArrayBuffer> {
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);
		const signature = await crypto.subtle.sign(
			"HMAC",
			key,
			encoder.encode(data),
		);
		return signature;
	}

	private async verifySignature(
		data: string,
		signature: string,
		secret: string,
	): Promise<boolean> {
		const expected = new Uint8Array(await this.signRaw(data, secret));
		const provided = this.base64urlDecodeToBytes(signature);

		if (expected.length !== provided.length) {
			return false;
		}

		return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
	}

	private base64urlEncodeString(str: string): string {
		return this.base64urlEncodeBytes(Buffer.from(str, "utf8"));
	}

	private base64urlEncodeBytes(bytes: Uint8Array): string {
		return Buffer.from(bytes)
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");
	}

	private base64urlDecodeToBytes(str: string): Uint8Array {
		let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
		while (base64.length % 4 !== 0) {
			base64 += "=";
		}
		return Buffer.from(base64, "base64");
	}

	private base64urlDecodeToString(str: string): string {
		return Buffer.from(this.base64urlDecodeToBytes(str)).toString("utf8");
	}
}
