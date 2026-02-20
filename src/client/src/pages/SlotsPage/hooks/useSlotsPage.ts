import { toaster } from "baseui/toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../api";

export interface Slot {
	id: number;
	name: string | null;
	start_at: string;
	end_at: string;
	is_active: number;
	created_at: string;
}

export type SlotStatusFilter = "all" | "active" | "inactive";

function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) return error.message;
	return fallback;
}

export function useSlotsPage(t: (key: string) => string) {
	const [slots, setSlots] = useState<Slot[]>([]);
	const [statusFilter, setStatusFilter] = useState<SlotStatusFilter>("all");
	const [modalOpen, setModalOpen] = useState(false);
	const [startAt, setStartAt] = useState("");
	const [endAt, setEndAt] = useState("");
	const [slotName, setSlotName] = useState("");
	const [loading, setLoading] = useState(false);

	const loadSlots = useCallback(async () => {
		try {
			const result = await api.getSlots();
			setSlots(result.data);
		} catch (err: unknown) {
			toaster.negative(getErrorMessage(err, t("common.error")), {});
		}
	}, [t]);

	useEffect(() => {
		loadSlots();
	}, [loadSlots]);

	const handleCreate = useCallback(async () => {
		if (!slotName.trim() || !startAt || !endAt) {
			toaster.negative(t("slots.startEndRequired"), {});
			return;
		}

		setLoading(true);
		try {
			await api.createSlot(
				slotName.trim(),
				new Date(startAt).toISOString(),
				new Date(endAt).toISOString(),
			);
			toaster.positive(t("slots.created"), {});
			setModalOpen(false);
			setSlotName("");
			setStartAt("");
			setEndAt("");
			await loadSlots();
		} catch (err: unknown) {
			toaster.negative(getErrorMessage(err, t("common.error")), {});
		} finally {
			setLoading(false);
		}
	}, [endAt, loadSlots, slotName, startAt, t]);

	const handleRename = useCallback(
		async (id: number, name: string) => {
			if (!name.trim()) {
				toaster.negative(t("slots.nameRequired"), {});
				return;
			}

			try {
				await api.renameSlot(id, name.trim());
				toaster.positive(t("slots.nameUpdated"), {});
				await loadSlots();
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			}
		},
		[loadSlots, t],
	);

	const handleToggle = useCallback(
		async (id: number, currentActive: number) => {
			try {
				await api.toggleSlot(id, !currentActive);
				toaster.positive(t("slots.updated"), {});
				await loadSlots();
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			}
		},
		[loadSlots, t],
	);

	const handleDelete = useCallback(
		async (id: number) => {
			try {
				await api.deleteSlot(id);
				toaster.positive(t("slots.deleted"), {});
				await loadSlots();
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			}
		},
		[loadSlots, t],
	);

	const filteredSlots = useMemo(() => {
		return slots.filter((slot) => {
			if (statusFilter === "active") {
				return Boolean(slot.is_active);
			}

			if (statusFilter === "inactive") {
				return !slot.is_active;
			}

			return true;
		});
	}, [slots, statusFilter]);

	return {
		endAt,
		handleCreate,
		handleDelete,
		handleRename,
		handleToggle,
		filteredSlots,
		loading,
		modalOpen,
		setEndAt,
		setModalOpen,
		setStatusFilter,
		setSlotName,
		setStartAt,
		slotName,
		slots,
		startAt,
		statusFilter,
	};
}
