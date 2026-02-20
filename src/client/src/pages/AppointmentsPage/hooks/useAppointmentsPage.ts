import { toaster } from "baseui/toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../api";

export interface Appointment {
	id: number;
	slot_id: number;
	name: string;
	email: string | null;
	meeting_place: string | null;
	note: string | null;
	start_at: string;
	end_at: string;
	cancel_token: string | null;
	canceled_at: string | null;
	canceled_by: string | null;
	created_at: string;
}

export type AppointmentStatusFilter = "all" | "active" | "past" | "canceled";

export function isPastAppointment(appointment: Appointment): boolean {
	return new Date(appointment.end_at).getTime() < Date.now();
}

export function canDeleteAppointment(appointment: Appointment): boolean {
	return Boolean(appointment.canceled_at) || isPastAppointment(appointment);
}

function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) return error.message;
	return fallback;
}

export function useAppointmentsPage(t: (key: string) => string) {
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [statusFilter, setStatusFilter] =
		useState<AppointmentStatusFilter>("all");

	const loadAppointments = useCallback(async () => {
		try {
			const result = await api.getAppointments();
			setAppointments(result.data);
		} catch (err: unknown) {
			toaster.negative(getErrorMessage(err, t("common.error")), {});
		}
	}, [t]);

	useEffect(() => {
		loadAppointments();
	}, [loadAppointments]);

	const handleCancel = useCallback(
		async (id: number) => {
			try {
				await api.cancelAppointment(id);
				toaster.positive(t("appointments.appointmentCanceled"), {});
				await loadAppointments();
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			}
		},
		[loadAppointments, t],
	);

	const handleDelete = useCallback(
		async (id: number) => {
			try {
				await api.deleteAppointment(id);
				toaster.positive(t("appointments.appointmentDeleted"), {});
				await loadAppointments();
			} catch (err: unknown) {
				toaster.negative(getErrorMessage(err, t("common.error")), {});
			}
		},
		[loadAppointments, t],
	);

	const filteredAppointments = useMemo(() => {
		return appointments.filter((apt) => {
			const isCanceled = Boolean(apt.canceled_at);
			const isPast = isPastAppointment(apt);

			if (statusFilter === "active") return !isCanceled && !isPast;
			if (statusFilter === "past") return !isCanceled && isPast;
			if (statusFilter === "canceled") return !!apt.canceled_at;
			return true;
		});
	}, [appointments, statusFilter]);

	return {
		filteredAppointments,
		handleCancel,
		handleDelete,
		statusFilter,
		setStatusFilter,
	};
}
