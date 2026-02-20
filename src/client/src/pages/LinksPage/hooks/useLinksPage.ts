import { toaster } from "baseui/toast";
import { useCallback, useEffect, useState } from "react";
import { type ApiSlot, api } from "../../../api";

export interface BookingLink {
	id: number;
	name: string;
	slug_id: string;
	allowed_slot_ids: number[];
	expires_at: string;
	created_at: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) return error.message;
	return fallback;
}

export function useLinksPage(t: (key: string) => string) {
	const [links, setLinks] = useState<BookingLink[]>([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [expiresDays, setExpiresDays] = useState("7");
	const [linkName, setLinkName] = useState("");
	const [slots, setSlots] = useState<ApiSlot[]>([]);
	const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);
	const [loading, setLoading] = useState(false);
	const [generatedUrl, setGeneratedUrl] = useState("");

	const loadLinks = useCallback(async () => {
		try {
			const result = await api.getLinks();
			setLinks(result.data);
		} catch (err: unknown) {
			toaster.negative(getErrorMessage(err, t("common.error")), {});
		}
	}, [t]);

	useEffect(() => {
		loadLinks();
	}, [loadLinks]);

	const loadSlots = useCallback(async () => {
		try {
			const result = await api.getSlots();
			setSlots(result.data.filter((slot) => slot.is_active === 1));
		} catch (err: unknown) {
			toaster.negative(getErrorMessage(err, t("common.error")), {});
		}
	}, [t]);

	useEffect(() => {
		loadSlots();
	}, [loadSlots]);

	const handleCreate = useCallback(async () => {
		if (selectedSlotIds.length === 0) {
			toaster.negative(t("links.selectAtLeastOneSlot"), {});
			return;
		}

		setLoading(true);
		try {
			const result = await api.createLink({
				expires_in_days: Number.parseInt(expiresDays, 10) || 7,
				name: linkName.trim() || undefined,
				slot_ids: selectedSlotIds,
			});
			setGeneratedUrl(result.data.url);
			toaster.positive(t("links.linkCreated"), {});
			await loadLinks();
		} catch (err: unknown) {
			toaster.negative(getErrorMessage(err, t("common.error")), {});
		} finally {
			setLoading(false);
		}
	}, [expiresDays, linkName, loadLinks, selectedSlotIds, t]);

	const handleDelete = useCallback(
		async (id: number) => {
			try {
				await api.deleteLink(id);
				toaster.positive(t("links.linkDeleted"), {});
				await loadLinks();
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			}
		},
		[loadLinks, t],
	);

	const copyToClipboard = useCallback(
		(text: string) => {
			navigator.clipboard.writeText(text).then(() => {
				toaster.positive(t("links.copied"), {});
			});
		},
		[t],
	);

	const toggleSlotSelection = useCallback((slotId: number) => {
		setSelectedSlotIds((prev) =>
			prev.includes(slotId)
				? prev.filter((id) => id !== slotId)
				: [...prev, slotId],
		);
	}, []);

	const resetCreateForm = useCallback(() => {
		setGeneratedUrl("");
		setLinkName("");
		setSelectedSlotIds([]);
		setExpiresDays("7");
	}, []);

	return {
		copyToClipboard,
		expiresDays,
		generatedUrl,
		handleCreate,
		handleDelete,
		linkName,
		links,
		loading,
		modalOpen,
		resetCreateForm,
		selectedSlotIds,
		setExpiresDays,
		setGeneratedUrl,
		setLinkName,
		setModalOpen,
		slots,
		toggleSlotSelection,
	};
}
