import { useCallback, useEffect, useMemo, useState } from "react";
import {
	type ApiAppointment,
	type ApiCommunityEvent,
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
	const [stats, setStats] = useState({
		slots: 0,
		appointments: 0,
		links: 0,
		plannerEvents: 0,
		communityEvents: 0,
	});
	const [slots, setSlots] = useState<ApiSlot[]>([]);
	const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
	const [plannerEvents, setPlannerEvents] = useState<ApiPlannerEvent[]>([]);
	const [communityEvents, setCommunityEvents] = useState<ApiCommunityEvent[]>(
		[],
	);

	const loadStats = useCallback(async () => {
		try {
			const [slotsRes, appointmentsRes, linksRes, plannerRes, communityRes] =
				await Promise.all([
					api.getSlots(),
					api.getAppointments(),
					api.getLinks(),
					api.getPlannerEvents(),
					api.getCommunityEvents(),
				]);
			setStats({
				slots: slotsRes.data.length,
				appointments: appointmentsRes.data.length,
				links: linksRes.data.length,
				plannerEvents: plannerRes.data.length,
				communityEvents: communityRes.data.length,
			});
			setSlots(slotsRes.data);
			setAppointments(appointmentsRes.data);
			setPlannerEvents(plannerRes.data);
			setCommunityEvents(communityRes.data);
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
				color: "var(--color-accent-600)",
			},
			{
				label: t("dashboard.appointments"),
				value: stats.appointments,
				color: "var(--color-info)",
			},
			{
				label: t("dashboard.bookingLinks"),
				value: stats.links,
				color: "var(--color-warning)",
			},
			{
				label: t("dashboard.plans"),
				value: stats.plannerEvents,
				color: "var(--color-success)",
			},
			{
				label: t("dashboard.events"),
				value: stats.communityEvents,
				color: "var(--color-error)",
			},
		],
		[stats, t],
	);

	return {
		appointments,
		cards,
		communityEvents,
		plannerEvents,
		slots,
	};
}
