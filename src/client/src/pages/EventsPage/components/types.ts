import type { ApiCommunityEvent } from "../../../api";

export interface CommunityApprovalRecord {
	full_name: string;
	email?: string;
	approved_at: string;
}

export type CommunityStatusFilter = "all" | "pending" | "active" | "canceled";

export const STATUS_COLORS: Record<string, string> = {
	pending: "var(--color-warning)",
	active: "var(--color-success)",
	canceled: "var(--color-error)",
};

export function statusLabel(
	t: (key: string) => string,
	status: string,
): string {
	const map: Record<string, string> = {
		pending: t("communityEvents.statusPending"),
		active: t("communityEvents.statusActive"),
		canceled: t("communityEvents.statusCanceled"),
	};
	return map[status] ?? status;
}

export function getApprovalRecords(
	event: ApiCommunityEvent,
): CommunityApprovalRecord[] {
	try {
		const parsed = JSON.parse(event.approvals_json);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(
			(value): value is CommunityApprovalRecord =>
				typeof value === "object" &&
				value !== null &&
				typeof (value as Record<string, unknown>).full_name === "string" &&
				typeof (value as Record<string, unknown>).approved_at === "string",
		);
	} catch {
		return [];
	}
}
