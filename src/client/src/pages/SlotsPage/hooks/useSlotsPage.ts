import { toaster } from "baseui/toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../api";
import { useListFilters } from "../../../hooks/useListFilters";

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
	const [editingSlot, setEditingSlot] = useState<Slot | null>(null);

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

	const handleUpdate = useCallback(async () => {
		if (!editingSlot) return;
		if (!slotName.trim() || !startAt || !endAt) {
			toaster.negative(t("slots.startEndRequired"), {});
			return;
		}

		setLoading(true);
		try {
			await api.updateSlot(editingSlot.id, {
				name: slotName.trim(),
				start_at: new Date(startAt).toISOString(),
				end_at: new Date(endAt).toISOString(),
			});
			toaster.positive(t("slots.updated"), {});
			setModalOpen(false);
			setEditingSlot(null);
			setSlotName("");
			setStartAt("");
			setEndAt("");
			await loadSlots();
		} catch (err: unknown) {
			toaster.negative(getErrorMessage(err, t("common.error")), {});
		} finally {
			setLoading(false);
		}
	}, [editingSlot, endAt, loadSlots, slotName, startAt, t]);

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

	const openEditModal = useCallback((slot: Slot) => {
		setEditingSlot(slot);
		setSlotName(slot.name || "");
		setStartAt(new Date(slot.start_at).toISOString().slice(0, 16));
		setEndAt(new Date(slot.end_at).toISOString().slice(0, 16));
		setModalOpen(true);
	}, []);

	const statusFilteredSlots = useMemo(() => {
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

	const {
		filteredItems: filteredSlots,
		search,
		setSearch,
		sort,
		setSort,
		from,
		setFrom,
		to,
		setTo,
		clearFilters,
		isActive,
	} = useListFilters({
		items: statusFilteredSlots,
		searchFields: ["name"],
		dateField: "start_at",
	});

	return {
		endAt,
		handleCreate,
		handleUpdate,
		handleDelete,
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
		editingSlot,
		openEditModal,
		search,
		setSearch,
		sort,
		setSort,
		from,
		setFrom,
		to,
		setTo,
		clearFilters,
		isActive,
		totalCount: statusFilteredSlots.length,
	};
}
