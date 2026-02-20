import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readAppVersionFromPackageJson(): string {
	const packageJsonPath = join(import.meta.dir, "..", "..", "package.json");
	if (!existsSync(packageJsonPath)) {
		console.warn("package.json not found, app version is undefined");
		return "undefined";
	}

	try {
		const content = readFileSync(packageJsonPath, "utf-8");
		const parsed = JSON.parse(content) as { version?: unknown };
		return typeof parsed.version === "string" &&
			parsed.version.trim().length > 0
			? parsed.version.trim()
			: "undefined";
	} catch {
		console.warn("package.json could not be parsed, app version is undefined");
		return "undefined";
	}
}

function loadEnv(): void {
	const envPath = join(import.meta.dir, "..", "..", ".env");
	if (!existsSync(envPath)) {
		console.warn(".env file not found, using defaults/environment variables");
		return;
	}
	const content = readFileSync(envPath, "utf-8");
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eqIndex = trimmed.indexOf("=");
		if (eqIndex === -1) continue;
		const key = trimmed.slice(0, eqIndex).trim();
		const value = trimmed.slice(eqIndex + 1).trim();
		if (!process.env[key]) {
			process.env[key] = value;
		}
	}
}

loadEnv();

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const isProduction =
	(process.env.NODE_ENV || "").toLowerCase() === "production";
const isHttpsBaseUrl = baseUrl.toLowerCase().startsWith("https://");

export const config = {
	port: parseInt(process.env.PORT || "3000", 10),
	host: process.env.HOST || "0.0.0.0",
	baseUrl,

	app: {
		version: readAppVersionFromPackageJson(),
	},

	github: {
		owner: process.env.GITHUB_REPO_OWNER || "sametcn99",
		repo: process.env.GITHUB_REPO_NAME || "booking-calendar",
	},

	admin: {
		username: process.env.ADMIN_USERNAME || "admin",
		password: process.env.ADMIN_PASSWORD || "changeme",
	},

	jwt: {
		secret: process.env.JWT_SECRET || "default-secret-change-me",
		refreshSecret:
			process.env.JWT_REFRESH_SECRET ||
			process.env.JWT_SECRET ||
			"default-secret-change-me",
		accessExpiresInSeconds: parseInt(
			process.env.JWT_ACCESS_EXPIRES_IN_SECONDS || "900",
			10,
		), // 15 minutes
		refreshExpiresInSeconds: parseInt(
			process.env.JWT_REFRESH_EXPIRES_IN_SECONDS || "2592000",
			10,
		), // 30 days
	},

	smtp: {
		host: process.env.SMTP_HOST || "smtp.example.com",
		port: parseInt(process.env.SMTP_PORT || "587", 10),
		secure: false,
		user: process.env.SMTP_USER || "",
		pass: process.env.SMTP_PASS || "",
		from: process.env.SMTP_FROM || "",
	},

	db: {
		path: process.env.DB_PATH || "./data/booking.db",
	},

	rateLimit: {
		windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
		maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "30", 10),
	},

	vapid: {
		publicKey: process.env.VITE_VAPID_PUBLIC_KEY || "",
		privateKey: process.env.VAPID_PRIVATE_KEY || "",
		email: process.env.ADMIN_EMAIL || "admin@example.com",
	},

	authCookies: {
		accessTokenName: "bc_access_token",
		refreshTokenName: "bc_refresh_token",
		path: "/",
		domain: "",
		sameSite: "Strict" as const,
		secure: isProduction || isHttpsBaseUrl,
	},
};
