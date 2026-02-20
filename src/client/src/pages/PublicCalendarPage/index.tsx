import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS, tr } from "date-fns/locale";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useStyletron } from "baseui";
import {
	Modal,
	ModalBody,
	ModalButton,
	ModalFooter,
	ModalHeader,
} from "baseui/modal";
import { useEffect, useState } from "react";
import type { ApiAppointment, ApiPlannerEvent, ApiSlot } from "../../api";
import { api } from "../../api";
import { useI18n } from "../../context/I18nContext";

const locales = { "en-US": enUS, "tr-TR": tr };
const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
});

interface CalendarEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	type: "slot" | "appointment" | "planner";
	data: ApiSlot | ApiAppointment | ApiPlannerEvent;
}

export default function PublicCalendarPage() {
	const [css] = useStyletron();
	const { language, t } = useI18n();
	const [slots, setSlots] = useState<ApiSlot[]>([]);
	const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
	const [plannerEvents, setPlannerEvents] = useState<ApiPlannerEvent[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [view, setView] = useState<"month" | "week" | "day">("week");
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
			})
			.catch(() => setError("Calendar is not available."));
	}, []);

	if (error) {
		return (
			<div
				className={css({
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
					backgroundColor: "var(--color-bg-primary)",
					color: "var(--color-text-muted)",
					fontSize: "18px",
				})}
			>
				{error}
			</div>
		);
	}

	const events: CalendarEvent[] = [
		...slots.map((s) => ({
			id: `slot-${s.id}`,
			title: s.name || "Available",
			start: new Date(s.start_at),
			end: new Date(s.end_at),
			type: "slot" as const,
			data: s,
		})),
		...appointments
			.filter((a) => !a.canceled_at)
			.map((a) => ({
				id: `appt-${a.id}`,
				title: "Busy",
				start: new Date(a.start_at),
				end: new Date(a.end_at),
				type: "appointment" as const,
				data: a,
			})),
		...plannerEvents.map((e) => ({
			id: `planner-${e.id}`,
			title: e.title,
			start: new Date(e.start_at),
			end: new Date(e.end_at),
			type: "planner" as const,
			data: e,
		})),
	];

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

		const styles: Record<string, React.CSSProperties> = {
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

	return (
		<div
			className={css({
				minHeight: "100vh",
				backgroundColor: "var(--color-bg-primary)",
				padding: "32px",
				color: "var(--color-text-primary)",
			})}
		>
			<h1
				className={css({
					fontSize: "28px",
					fontWeight: 700,
					color: "var(--color-text-primary)",
					marginBottom: "24px",
					textAlign: "center",
				})}
			>
				Calendar
			</h1>

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

			<div
				className={css({
					height: "700px",
					maxWidth: "1200px",
					margin: "0 auto",
				})}
			>
				<Calendar
					localizer={localizer}
					events={events}
					startAccessor="start"
					endAccessor="end"
					style={{ height: "100%" }}
					eventPropGetter={eventStyleGetter}
					views={["month", "week", "day"]}
					view={view}
					onView={(v) => setView(v as "month" | "week" | "day")}
					date={date}
					onNavigate={(d) => setDate(d)}
					culture={language === "tr" ? "tr-TR" : "en-US"}
					messages={{
						next: t("dashboard.calendar.next"),
						previous: t("dashboard.calendar.previous"),
						today: t("dashboard.calendar.today"),
						month: t("dashboard.calendar.month"),
						week: t("dashboard.calendar.week"),
						day: t("dashboard.calendar.day"),
						agenda: t("dashboard.calendar.agenda"),
						date: t("dashboard.calendar.date"),
						time: t("dashboard.calendar.time"),
						event: t("dashboard.calendar.event"),
						showMore: (total: number) =>
							`+${total} ${t("dashboard.calendar.more")}`,
					}}
					onSelectEvent={(event) => {
						setSelectedEvent(event as CalendarEvent);
						setIsOpen(true);
					}}
				/>
			</div>

			<Modal
				onClose={() => setIsOpen(false)}
				isOpen={isOpen}
				overrides={{
					Root: {
						style: {
							zIndex: 2000,
						},
					},
				}}
			>
				<ModalHeader>{selectedEvent?.title}</ModalHeader>
				<ModalBody>
					{selectedEvent?.type === "appointment" && (
						<div>
							<p>
								<strong>{t("dashboard.calendar.name")}:</strong>{" "}
								{(selectedEvent.data as ApiAppointment).name}
							</p>
							<p>
								<strong>{t("dashboard.calendar.email")}:</strong>{" "}
								{(selectedEvent.data as ApiAppointment).email || "-"}
							</p>
							<p>
								<strong>{t("dashboard.calendar.note")}:</strong>{" "}
								{(selectedEvent.data as ApiAppointment).note || "-"}
							</p>
							<p>
								<strong>{t("dashboard.calendar.timeLabel")}:</strong>{" "}
								{selectedEvent.start.toLocaleString()} -{" "}
								{selectedEvent.end.toLocaleString()}
							</p>
						</div>
					)}
					{selectedEvent?.type === "slot" && (
						<div>
							<p>
								<strong>{t("dashboard.calendar.status")}:</strong>{" "}
								{t("dashboard.calendar.availableSlot")}
							</p>
							<p>
								<strong>{t("dashboard.calendar.timeLabel")}:</strong>{" "}
								{selectedEvent.start.toLocaleString()} -{" "}
								{selectedEvent.end.toLocaleString()}
							</p>
						</div>
					)}
					{selectedEvent?.type === "planner" && (
						<div>
							<p>
								<strong>{t("planner.eventTitle")}:</strong>{" "}
								{(selectedEvent.data as ApiPlannerEvent).title}
							</p>
							{(selectedEvent.data as ApiPlannerEvent).description && (
								<p>
									<strong>{t("planner.description")}:</strong>{" "}
									{(selectedEvent.data as ApiPlannerEvent).description}
								</p>
							)}
							<p>
								<strong>{t("dashboard.calendar.timeLabel")}:</strong>{" "}
								{selectedEvent.start.toLocaleString()} -{" "}
								{selectedEvent.end.toLocaleString()}
							</p>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<ModalButton onClick={() => setIsOpen(false)}>
						{t("dashboard.calendar.close")}
					</ModalButton>
				</ModalFooter>
			</Modal>
		</div>
	);
}
