import { toaster } from "baseui/toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../api";
import { useListFilters } from "../../../hooks/useListFilters";

export interface Appointment {
	id: number;
	slot_id: number;
	name: string;
	email: string | null;
	meeting_place: string | null;
	note: string | null;
	start_at: string;
	end_at: string;
	slug_id: string | null;
	status: "pending" | "approved" | "rejected";
	canceled_at: string | null;
	canceled_by: string | null;
	created_at: string;
}

export type AppointmentStatusFilter =
	| "all"
	| "active"
	| "past"
	| "canceled"
	| "pending"
	| "rejected";

export function isPastAppointment(appointment: Appointment): boolean {
	return new Date(appointment.end_at).getTime() < Date.now();
}

export function canDeleteAppointment(appointment: Appointment): boolean {
	return (
		Boolean(appointment.canceled_at) ||
		isPastAppointment(appointment) ||
		appointment.status === "rejected"
	);
}

function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) return error.message;
	return fallback;
}

export function useAppointmentsPage(t: (key: string) => string) {
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [statusFilter, setStatusFilter] =
		useState<AppointmentStatusFilter>("all");
	const [initialLoading, setInitialLoading] = useState(true);

	const loadAppointments = useCallback(async () => {
		try {
			const result = await api.getAppointments("all");
			setAppointments(result.data);
		} catch (err: unknown) {
			toaster.negative(getErrorMessage(err, t("common.error")), {});
		} finally {
			setInitialLoading(false);
		}
	}, [t]);

	useEffect(() => {
		loadAppointments();
	}, [loadAppointments]);

	const handleCancel = useCallback(
		async (slugId: string) => {
			try {
				await api.cancelAppointment(slugId);
				toaster.positive(t("appointments.appointmentCanceled"), {});
				await loadAppointments();
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			}
		},
		[loadAppointments, t],
	);

	const handleDelete = useCallback(
		async (slugId: string) => {
			try {
				await api.deleteAppointment(slugId);
				toaster.positive(t("appointments.appointmentDeleted"), {});
				await loadAppointments();
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			}
		},
		[loadAppointments, t],
	);

	const handleApprove = useCallback(
		async (slugId: string) => {
			try {
				await api.approveAppointment(slugId);
				toaster.positive(t("appointments.appointmentApproved"), {});
				await loadAppointments();
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			}
		},
		[loadAppointments, t],
	);

	const handleReject = useCallback(
		async (slugId: string) => {
			try {
				await api.rejectAppointment(slugId);
				toaster.positive(t("appointments.appointmentRejected"), {});
				await loadAppointments();
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			}
		},
		[loadAppointments, t],
	);

	const statusFilteredAppointments = useMemo(() => {
		return appointments.filter((apt) => {
			const isCanceled = Boolean(apt.canceled_at);
			if (statusFilter === "canceled") return isCanceled;
			if (statusFilter === "rejected") return apt.status === "rejected";

			const isPast = isPastAppointment(apt);

			if (statusFilter === "pending")
				return apt.status === "pending" && !isCanceled;
			if (statusFilter === "active")
				return apt.status === "approved" && !isCanceled && !isPast;
			if (statusFilter === "past")
				return apt.status === "approved" && !isCanceled && isPast;
			return true;
		});
	}, [appointments, statusFilter]);

	const {
		filteredItems: filteredAppointments,
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
		items: statusFilteredAppointments,
		searchFields: ["name", "email", "meeting_place", "note"],
		dateField: "start_at",
	});

	const pendingCount = useMemo(
		() =>
			appointments.filter((a) => a.status === "pending" && !a.canceled_at)
				.length,
		[appointments],
	);

	return {
		initialLoading,
		filteredAppointments,
		handleCancel,
		handleDelete,
		handleApprove,
		handleReject,
		statusFilter,
		setStatusFilter,
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
		totalCount: statusFilteredAppointments.length,
		pendingCount,
	};
}
