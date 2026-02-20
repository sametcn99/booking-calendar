import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS, tr } from "date-fns/locale";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { CalendarEvent, CalendarView } from "../types";

const locales = { "en-US": enUS, "tr-TR": tr };
const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
});

interface Props {
	culture: "en-US" | "tr-TR";
	date: Date;
	eventStyleGetter: (event: CalendarEvent) => {
		style: Record<string, string | number>;
	};
	events: CalendarEvent[];
	onNavigate: (date: Date) => void;
	onSelectEvent: (event: CalendarEvent) => void;
	onView: (view: CalendarView) => void;
	messages: {
		next: string;
		previous: string;
		today: string;
		month: string;
		week: string;
		day: string;
		agenda: string;
		date: string;
		time: string;
		event: string;
		showMore: (total: number) => string;
	};
	view: CalendarView;
}

export default function PublicCalendarView({
	culture,
	date,
	eventStyleGetter,
	events,
	messages,
	onNavigate,
	onSelectEvent,
	onView,
	view,
}: Props) {
	return (
		<>
			<style>{`
				.rbc-calendar { font-family: system-ui, sans-serif; border-radius: 12px; overflow: hidden; background-color: var(--color-bg-secondary); border: 1px solid var(--color-bg-quaternary); }
				.rbc-toolbar { padding: 12px; margin-bottom: 0; background-color: var(--color-bg-secondary); border-bottom: 1px solid var(--color-bg-quaternary); }
				.rbc-toolbar .rbc-toolbar-label { font-weight: 700; color: var(--color-text-primary); font-size: 1.1em; }
				.rbc-toolbar button { color: var(--color-text-primary); border: 1px solid var(--color-accent-300); border-radius: 8px; background: var(--color-bg-tertiary); padding: 8px 16px; font-weight: 600; cursor: pointer; }
				.rbc-toolbar button:hover { background: var(--color-bg-quaternary) !important; border-color: var(--color-accent-600) !important; }
				.rbc-toolbar button:active, .rbc-toolbar button.rbc-active { background-color: var(--color-accent-600) !important; color: var(--color-text-on-primary) !important; border-color: var(--color-accent-600) !important; }
				.rbc-toolbar button:focus { background-color: var(--color-bg-tertiary); color: var(--color-text-primary); }
				.rbc-time-view { border-top: 0; background-color: var(--color-bg-secondary); }
				.rbc-time-header.rbc-overflowing { border-right: 1px solid var(--color-bg-quaternary); }
				.rbc-time-header-content { border-left: 1px solid var(--color-bg-quaternary); }
				.rbc-header { color: var(--color-text-muted); background: var(--color-bg-secondary); padding: 10px 8px; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid var(--color-bg-quaternary); }
				.rbc-label { padding: 0 5px; color: var(--color-text-muted); font-size: 11px; }
				.rbc-time-content { border-top: 1px solid var(--color-bg-quaternary); }
				.rbc-timeslot-group { border-bottom: 1px solid var(--color-bg-quaternary); min-height: 48px; }
				.rbc-day-slot .rbc-time-slot { border-top: 1px solid var(--color-bg-quaternary); opacity: 0.3; }
				.rbc-time-gutter .rbc-timeslot-group { border-color: transparent; }
				.rbc-today { background-color: color-mix(in srgb, var(--color-accent-800) 7%, transparent); }
				.rbc-current-time-indicator { background-color: var(--color-accent-600); height: 2px; }
				.rbc-off-range-bg { background-color: var(--color-bg-off-range); }
				.rbc-time-header-gutter.rbc-header { border-right: none; }
				.rbc-month-view, .rbc-month-row, .rbc-time-view, .rbc-time-header, .rbc-time-header-content, .rbc-time-content, .rbc-timeslot-group, .rbc-day-bg, .rbc-day-slot, .rbc-header, .rbc-agenda-view, .rbc-agenda-table, .rbc-agenda-table td, .rbc-agenda-table th { border-color: var(--color-bg-quaternary) !important; }
			`}</style>

			<Calendar
				localizer={localizer}
				events={events}
				startAccessor="start"
				endAccessor="end"
				style={{ height: "100%" }}
				eventPropGetter={eventStyleGetter}
				views={["month", "week", "day"]}
				view={view}
				onView={(nextView) => onView(nextView as CalendarView)}
				date={date}
				onNavigate={onNavigate}
				culture={culture}
				messages={messages}
				onSelectEvent={(event) => onSelectEvent(event as CalendarEvent)}
			/>
		</>
	);
}
