import type {
	ApiAppointment,
	ApiCommunityEvent,
	ApiPlannerEvent,
	ApiSlot,
} from "../../api";

export interface CalendarEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	type: "slot" | "appointment" | "planner" | "community";
	data: ApiSlot | ApiAppointment | ApiPlannerEvent | ApiCommunityEvent;
}

export type CalendarView = "month" | "week" | "day";
