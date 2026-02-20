import { toaster } from "baseui/toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type ApiCommunityEvent, api } from "../../../api";
import { APP_COLORS } from "../../../theme";
import type { CommunityStatusFilter } from "../components/types";

function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) return error.message;
	return fallback;
}

export function useCommunityEventsSection(t: (key: string) => string) {
	const [events, setEvents] = useState<ApiCommunityEvent[]>([]);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startAt, setStartAt] = useState("");
	const [endAt, setEndAt] = useState("");
	const [color, setColor] = useState<string>(APP_COLORS.accent800);
	const [requiredApprovals, setRequiredApprovals] = useState(3);
	const [creating, setCreating] = useState(false);
	const [statusFilter, setStatusFilter] =
		useState<CommunityStatusFilter>("all");
	const [confirmDeleteSlugId, setConfirmDeleteSlugId] = useState<string | null>(
		null,
	);

	const getShareLink = useCallback(
		(slugId: string) => `${window.location.origin}/community/${slugId}`,
		[],
	);

	const fetchEvents = useCallback(async () => {
		try {
			const result = await api.getCommunityEvents();
			setEvents(result.data);
		} catch {
			// Keep silent to preserve existing behavior on initial load failures.
		}
	}, []);

	useEffect(() => {
		fetchEvents();
	}, [fetchEvents]);

	const resetForm = useCallback(() => {
		setTitle("");
		setDescription("");
		setStartAt("");
		setEndAt("");
		setColor(APP_COLORS.accent800);
		setRequiredApprovals(3);
	}, []);

	const handleCreate = useCallback(
		async (onCreated: () => void) => {
			if (!title || !startAt || !endAt) {
				toaster.negative(t("communityEvents.fieldsRequired"), {});
				return;
			}

			setCreating(true);
			try {
				const created = await api.createCommunityEvent({
					title,
					description: description || undefined,
					start_at: startAt,
					end_at: endAt,
					color,
					required_approvals: requiredApprovals,
				});
				toaster.positive(t("communityEvents.created"), {});
				toaster.info(
					`${t("communityEvents.shareLink")}: ${getShareLink(created.data.slug_id)}`,
					{},
				);
				resetForm();
				onCreated();
				await fetchEvents();
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			} finally {
				setCreating(false);
			}
		},
		[
			color,
			description,
			endAt,
			fetchEvents,
			getShareLink,
			requiredApprovals,
			resetForm,
			startAt,
			t,
			title,
		],
	);

	const handleDelete = useCallback(
		async (slugId: string) => {
			try {
				await api.deleteCommunityEvent(slugId);
				toaster.positive(t("communityEvents.deleted"), {});
				await fetchEvents();
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			}
		},
		[fetchEvents, t],
	);

	const handleConfirmDelete = useCallback(async () => {
		if (!confirmDeleteSlugId) return;
		await handleDelete(confirmDeleteSlugId);
		setConfirmDeleteSlugId(null);
	}, [confirmDeleteSlugId, handleDelete]);

	const handleCopyLink = useCallback(
		async (slugId: string) => {
			const link = getShareLink(slugId);
			await navigator.clipboard.writeText(link);
			toaster.positive(t("communityEvents.copied"), {});
		},
		[getShareLink, t],
	);

	const filteredEvents = useMemo(() => {
		if (statusFilter === "all") return events;
		return events.filter((event) => event.status === statusFilter);
	}, [events, statusFilter]);

	return {
		color,
		confirmDeleteSlugId,
		creating,
		description,
		endAt,
		filteredEvents,
		getShareLink,
		handleConfirmDelete,
		handleCopyLink,
		handleCreate,
		requiredApprovals,
		setColor,
		setConfirmDeleteSlugId,
		setDescription,
		setEndAt,
		setRequiredApprovals,
		setStartAt,
		setStatusFilter,
		setTitle,
		startAt,
		statusFilter,
		title,
	};
}
