import { useEffect, useMemo, useState } from "react";
import {
	type ApiAppointment,
	type ApiCommunityEvent,
	type ApiPlannerEvent,
	type ApiSlot,
	api,
} from "../../../api";
import type { CalendarEvent, CalendarView } from "../types";

export function usePublicCalendarPage(t: (key: string) => string) {
	const [slots, setSlots] = useState<ApiSlot[]>([]);
	const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
	const [plannerEvents, setPlannerEvents] = useState<ApiPlannerEvent[]>([]);
	const [communityEvents, setCommunityEvents] = useState<ApiCommunityEvent[]>(
		[],
	);
	const [error, setError] = useState<string | null>(null);
	const [view, setView] = useState<CalendarView>("week");
	const [date, setDate] = useState(new Date());
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
		null,
	);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		api
			.getPublicCalendar()
			.then((res) => {
				setSlots(res.data.slots);
				setAppointments(res.data.appointments);
				setPlannerEvents(res.data.planner_events);
				setCommunityEvents(res.data.community_events);
			})
			.catch(() => setError("Calendar is not available."));
	}, []);

	const activeAppointments = useMemo(() => {
		const now = Date.now();
		return appointments.filter((appt) => {
			if (appt.canceled_at) return false;
			return new Date(appt.end_at).getTime() >= now;
		});
	}, [appointments]);

	const events: CalendarEvent[] = useMemo(
		() => [
			...slots.map((slot) => ({
				id: `slot-${slot.id}`,
				title: t("dashboard.calendar.availableSlot"),
				start: new Date(slot.start_at),
				end: new Date(slot.end_at),
				type: "slot" as const,
				data: slot,
			})),
			...activeAppointments.map((appointment) => ({
				id: `appt-${appointment.id}`,
				title: appointment.name,
				start: new Date(appointment.start_at),
				end: new Date(appointment.end_at),
				type: "appointment" as const,
				data: appointment,
			})),
			...plannerEvents.map((plannerEvent) => ({
				id: `planner-${plannerEvent.id}`,
				title: plannerEvent.title,
				start: new Date(plannerEvent.start_at),
				end: new Date(plannerEvent.end_at),
				type: "planner" as const,
				data: plannerEvent,
			})),
			...communityEvents.map((communityEvent) => ({
				id: `community-${communityEvent.id}`,
				title: communityEvent.title,
				start: new Date(communityEvent.start_at),
				end: new Date(communityEvent.end_at),
				type: "community" as const,
				data: communityEvent,
			})),
		],
		[slots, activeAppointments, plannerEvents, communityEvents, t],
	);

	const eventStyleGetter = (event: CalendarEvent) => {
		if (event.type === "planner") {
			const color =
				(event.data as ApiPlannerEvent).color || "var(--color-warning)";
			return {
				style: {
					background: `linear-gradient(135deg, ${color}33, ${color}66)`,
					color: "var(--color-text-on-primary)",
					border: `1px solid ${color}`,
					borderRadius: "8px",
					padding: "2px 8px",
					fontWeight: 600,
				},
			};
		}

		if (event.type === "community") {
			const data = event.data as ApiCommunityEvent;
			const statusColorMap: Record<string, string> = {
				pending: "var(--color-warning)",
				active: "var(--color-success)",
				canceled: "var(--color-error)",
			};
			const color =
				data.color || statusColorMap[data.status] || "var(--color-info)";

			return {
				style: {
					background: `linear-gradient(135deg, ${color}2b, ${color}5c)`,
					color: "var(--color-text-on-primary)",
					border: `1px solid ${color}`,
					borderRadius: "8px",
					padding: "2px 8px",
					fontWeight: 600,
				},
			};
		}

		const styles: Record<
			"slot" | "appointment",
			Record<string, string | number>
		> = {
			slot: {
				background:
					"linear-gradient(135deg, color-mix(in srgb, var(--color-success) 12%, transparent), color-mix(in srgb, var(--color-success) 24%, transparent))",
				color: "var(--color-success-light)",
				border: "1px solid var(--color-success)",
				borderRadius: "8px",
				padding: "2px 8px",
				fontWeight: 600,
			},
			appointment: {
				background:
					"linear-gradient(135deg, color-mix(in srgb, var(--color-accent-600) 80%, transparent), var(--color-accent-800))",
				color: "var(--color-text-on-primary)",
				border: "1px solid var(--color-accent-400)",
				borderRadius: "8px",
				padding: "2px 8px",
				fontWeight: 600,
			},
		};

		return { style: styles[event.type] };
	};

	const handleSelectEvent = (event: CalendarEvent) => {
		setSelectedEvent(event);
		setIsOpen(true);
	};

	return {
		date,
		error,
		eventStyleGetter,
		events,
		handleSelectEvent,
		isOpen,
		selectedEvent,
		setDate,
		setIsOpen,
		setView,
		view,
	};
}
