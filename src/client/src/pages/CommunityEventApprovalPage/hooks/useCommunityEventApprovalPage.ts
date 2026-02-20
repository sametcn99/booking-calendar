import { toaster } from "baseui/toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { type ApiCommunityEvent, api } from "../../../api";

const normalizeApproverName = (value: string) =>
	value.trim().replace(/\s+/g, " ").toLowerCase();

function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) return error.message;
	return fallback;
}

export function useCommunityEventApprovalPage(t: (key: string) => string) {
	const { slugId } = useParams<{ slugId: string }>();
	const [event, setEvent] = useState<ApiCommunityEvent | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [approving, setApproving] = useState(false);
	const [approved, setApproved] = useState(false);
	const [approverName, setApproverName] = useState("");
	const [alreadyApprovedLocal, setAlreadyApprovedLocal] = useState(false);

	const getStorageKey = useCallback(
		() => (slugId ? `community_event_approved_${slugId}` : ""),
		[slugId],
	);

	const getStoredApprovers = useCallback((): string[] => {
		const key = getStorageKey();
		if (!key) return [];
		try {
			const parsed = JSON.parse(localStorage.getItem(key) || "[]");
			if (!Array.isArray(parsed)) return [];
			return parsed.filter(
				(value): value is string => typeof value === "string",
			);
		} catch {
			return [];
		}
	}, [getStorageKey]);

	const fetchEvent = useCallback(() => {
		if (!slugId) return;
		api
			.getPublicCommunityEvent(slugId)
			.then((result) => setEvent(result.data))
			.catch(() => setError(t("common.error")));
	}, [slugId, t]);

	useEffect(() => {
		fetchEvent();
	}, [fetchEvent]);

	useEffect(() => {
		const stored = getStoredApprovers();
		if (approverName && stored.includes(normalizeApproverName(approverName))) {
			setAlreadyApprovedLocal(true);
			return;
		}
		setAlreadyApprovedLocal(false);
	}, [approverName, getStoredApprovers]);

	const handleApprove = useCallback(async () => {
		if (!slugId) return;
		const normalizedName = normalizeApproverName(approverName);
		if (normalizedName.length < 3 || !normalizedName.includes(" ")) {
			toaster.negative(t("communityEvents.fullNameInvalid"), {});
			return;
		}

		const approvalId = normalizedName;
		if (getStoredApprovers().includes(approvalId)) {
			setAlreadyApprovedLocal(true);
			toaster.negative(t("communityEvents.alreadyApprovedLocal"), {});
			return;
		}

		setApproving(true);
		try {
			const result = await api.approveCommunityEvent(slugId, {
				full_name: approverName.trim().replace(/\s+/g, " "),
			});
			setEvent(result.data);
			setApproved(true);
			const key = getStorageKey();
			const stored = getStoredApprovers();
			if (key && !stored.includes(approvalId)) {
				localStorage.setItem(key, JSON.stringify([...stored, approvalId]));
			}
			setAlreadyApprovedLocal(true);
			setApproverName("");
		} catch (err: unknown) {
			toaster.negative(getErrorMessage(err, t("common.error")), {});
		} finally {
			setApproving(false);
		}
	}, [approverName, getStorageKey, getStoredApprovers, slugId, t]);

	const shareLink = useMemo(
		() => (slugId ? `${window.location.origin}/community/${slugId}` : ""),
		[slugId],
	);

	const handleCopyLink = useCallback(async () => {
		if (!shareLink) return;
		await navigator.clipboard.writeText(shareLink);
		toaster.positive(t("communityEvents.copied"), {});
	}, [shareLink, t]);

	const progress = useMemo(() => {
		if (!event) return 0;
		return Math.min(
			(event.current_approvals / event.required_approvals) * 100,
			100,
		);
	}, [event]);

	return {
		alreadyApprovedLocal,
		approved,
		approverName,
		approving,
		error,
		event,
		handleApprove,
		handleCopyLink,
		progress,
		setApproverName,
		shareLink,
	};
}
