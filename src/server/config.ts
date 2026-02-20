import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

export const config = {
	port: parseInt(process.env.PORT || "3000", 10),
	host: process.env.HOST || "0.0.0.0",
	baseUrl: process.env.BASE_URL || "http://localhost:3000",

	admin: {
		username: process.env.ADMIN_USERNAME || "admin",
		password: process.env.ADMIN_PASSWORD || "changeme",
	},

	jwt: {
		secret: process.env.JWT_SECRET || "default-secret-change-me",
		expiresInSeconds: 86400, // 24 hours
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
};
