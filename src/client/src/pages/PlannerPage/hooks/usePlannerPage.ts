import { toaster } from "baseui/toast";
import { useCallback, useEffect, useState } from "react";
import { type ApiPlannerEvent, api } from "../../../api";
import { APP_COLORS } from "../../../theme";

function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) return error.message;
	return fallback;
}

export interface PlannerFormState {
	title: string;
	description: string;
	startAt: string;
	endAt: string;
	color: string;
}

const emptyForm: PlannerFormState = {
	title: "",
	description: "",
	startAt: "",
	endAt: "",
	color: APP_COLORS.warning,
};

export function usePlannerPage(t: (key: string) => string) {
	const [events, setEvents] = useState<ApiPlannerEvent[]>([]);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingEvent, setEditingEvent] = useState<ApiPlannerEvent | null>(
		null,
	);
	const [form, setForm] = useState<PlannerFormState>(emptyForm);
	const [loading, setLoading] = useState(false);

	const loadEvents = useCallback(async () => {
		try {
			const result = await api.getPlannerEvents();
			setEvents(result.data);
		} catch (err: unknown) {
			toaster.negative(getErrorMessage(err, t("common.error")), {});
		}
	}, [t]);

	useEffect(() => {
		loadEvents();
	}, [loadEvents]);

	const openCreate = useCallback(() => {
		setEditingEvent(null);
		setForm(emptyForm);
		setModalOpen(true);
	}, []);

	const openEdit = useCallback((event: ApiPlannerEvent) => {
		setEditingEvent(event);
		setForm({
			title: event.title,
			description: event.description || "",
			startAt: event.start_at.slice(0, 16),
			endAt: event.end_at.slice(0, 16),
			color: event.color || APP_COLORS.warning,
		});
		setModalOpen(true);
	}, []);

	const handleSave = useCallback(async () => {
		if (!form.title.trim() || !form.startAt || !form.endAt) {
			toaster.negative(t("planner.fieldsRequired"), {});
			return;
		}

		setLoading(true);
		try {
			const payload = {
				title: form.title.trim(),
				description: form.description.trim() || undefined,
				start_at: new Date(form.startAt).toISOString(),
				end_at: new Date(form.endAt).toISOString(),
				color: form.color || undefined,
			};

			if (editingEvent) {
				await api.updatePlannerEvent(editingEvent.id, payload);
				toaster.positive(t("planner.updated"), {});
			} else {
				await api.createPlannerEvent(payload);
				toaster.positive(t("planner.created"), {});
			}
			setModalOpen(false);
			setForm(emptyForm);
			setEditingEvent(null);
			await loadEvents();
		} catch (err: unknown) {
			toaster.negative(getErrorMessage(err, t("common.error")), {});
		} finally {
			setLoading(false);
		}
	}, [editingEvent, form, loadEvents, t]);

	const handleDelete = useCallback(
		async (id: number) => {
			try {
				await api.deletePlannerEvent(id);
				toaster.positive(t("planner.deleted"), {});
				await loadEvents();
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			}
		},
		[loadEvents, t],
	);

	const updateForm = useCallback(
		(field: keyof PlannerFormState, value: string) => {
			setForm((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	return {
		editingEvent,
		events,
		form,
		handleDelete,
		handleSave,
		loading,
		modalOpen,
		openCreate,
		openEdit,
		setModalOpen,
		updateForm,
	};
}
