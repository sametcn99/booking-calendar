import { config } from "../config";

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of store) {
		if (entry.resetAt < now) {
			store.delete(key);
		}
	}
}, 60000);

export function checkRateLimit(ip: string): {
	allowed: boolean;
	remaining: number;
	retryAfterMs: number;
} {
	const now = Date.now();
	let entry = store.get(ip);

	if (!entry || entry.resetAt < now) {
		entry = {
			count: 0,
			resetAt: now + config.rateLimit.windowMs,
		};
		store.set(ip, entry);
	}

	entry.count++;

	if (entry.count > config.rateLimit.maxRequests) {
		return {
			allowed: false,
			remaining: 0,
			retryAfterMs: entry.resetAt - now,
		};
	}

	return {
		allowed: true,
		remaining: config.rateLimit.maxRequests - entry.count,
		retryAfterMs: 0,
	};
}
