import { config } from "../config";
import type {
	CalDAVErrorBreakdown,
	CalDAVErrorCategory,
	CalDAVSyncPolicy,
} from "../types";

export interface CalDAVErrorClassification {
	message: string;
	category: CalDAVErrorCategory;
	retryable: boolean;
}

export function normalizeCalDAVSyncPolicy(
	value: string | null | undefined,
): CalDAVSyncPolicy {
	return value === "read_only_busy" || value === "two_way_guarded"
		? value
		: "one_way_write";
}

export function policyUsesCalDAVWriteback(policy: CalDAVSyncPolicy): boolean {
	return policy !== "read_only_busy";
}

export function emptyCalDAVErrorBreakdown(): CalDAVErrorBreakdown {
	return {
		auth: 0,
		network: 0,
		conflict: 0,
		validation: 0,
		calendar: 0,
		unknown: 0,
	};
}

export function classifyCalDAVError(
	error: unknown,
	fallbackMessage: string,
): CalDAVErrorClassification {
	const message =
		error instanceof Error && error.message.trim().length > 0
			? error.message
			: fallbackMessage;
	const normalized = message.toLowerCase();

	if (
		normalized.includes("401") ||
		normalized.includes("403") ||
		normalized.includes("auth") ||
		normalized.includes("credential") ||
		normalized.includes("password") ||
		normalized.includes("unauthorized") ||
		normalized.includes("forbidden")
	) {
		return { message, category: "auth", retryable: false };
	}

	if (
		normalized.includes("412") ||
		normalized.includes("etag") ||
		normalized.includes("if-match") ||
		normalized.includes("precondition") ||
		normalized.includes("conflict")
	) {
		return { message, category: "conflict", retryable: true };
	}

	if (
		normalized.includes("timeout") ||
		normalized.includes("network") ||
		normalized.includes("fetch") ||
		normalized.includes("socket") ||
		normalized.includes("econn") ||
		normalized.includes("temporarily")
	) {
		return { message, category: "network", retryable: true };
	}

	if (
		normalized.includes("calendar") ||
		normalized.includes("404") ||
		normalized.includes("not found") ||
		normalized.includes("writable")
	) {
		return { message, category: "calendar", retryable: false };
	}

	if (
		normalized.includes("invalid") ||
		normalized.includes("malformed") ||
		normalized.includes("parse") ||
		normalized.includes("required")
	) {
		return { message, category: "validation", retryable: false };
	}

	return { message, category: "unknown", retryable: true };
}

export function calculateCalDAVNextRetryAt(retryCount: number): string {
	const exponent = Math.max(0, retryCount - 1);
	const delayMs = Math.min(
		config.caldav.retryBackoffBaseMs * 2 ** exponent,
		config.caldav.retryBackoffMaxMs,
	);
	return new Date(Date.now() + delayMs).toISOString();
}
