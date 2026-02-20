import { useCallback, useEffect, useMemo, useState } from "react";
import {
	type ApiAppointment,
	type ApiPlannerEvent,
	type ApiSlot,
	api,
} from "../../../api";

export interface DashboardStatCard {
	label: string;
	value: number;
	color: string;
}

interface Params {
	t: (key: string) => string;
}

export function useDashboardPage({ t }: Params) {
	const [stats, setStats] = useState({ slots: 0, appointments: 0, links: 0 });
	const [slots, setSlots] = useState<ApiSlot[]>([]);
	const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
	const [plannerEvents, setPlannerEvents] = useState<ApiPlannerEvent[]>([]);

	const loadStats = useCallback(async () => {
		try {
			const [slotsRes, appointmentsRes, linksRes, plannerRes] =
				await Promise.all([
					api.getSlots(),
					api.getAppointments(),
					api.getLinks(),
					api.getPlannerEvents(),
				]);
			setStats({
				slots: slotsRes.data.length,
				appointments: appointmentsRes.data.length,
				links: linksRes.data.length,
			});
			setSlots(slotsRes.data);
			setAppointments(appointmentsRes.data);
			setPlannerEvents(plannerRes.data);
		} catch (err) {
			console.error("Failed to load stats:", err);
		}
	}, []);

	useEffect(() => {
		loadStats();
	}, [loadStats]);

	const cards: DashboardStatCard[] = useMemo(
		() => [
			{
				label: t("dashboard.totalSlots"),
				value: stats.slots,
				color: "#7c3aed",
			},
			{
				label: t("dashboard.appointments"),
				value: stats.appointments,
				color: "#2dd4bf",
			},
			{
				label: t("dashboard.bookingLinks"),
				value: stats.links,
				color: "#f59e0b",
			},
		],
		[stats, t],
	);

	return {
		appointments,
		cards,
		plannerEvents,
		slots,
	};
}
