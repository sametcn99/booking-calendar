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
					backgroundColor: "#0a0a0a",
					color: "#888",
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
			const color = (event.data as ApiPlannerEvent).color || "#f59e0b";
			return {
				style: {
					background: `linear-gradient(135deg, ${color}33, ${color}66)`,
					color: "#fff",
					border: `1px solid ${color}`,
					borderRadius: "8px",
					padding: "2px 8px",
					fontWeight: 600,
				},
			};
		}

		const styles: Record<string, React.CSSProperties> = {
			slot: {
				background: "linear-gradient(135deg, #16a34a20, #16a34a3d)",
				color: "#4ade80",
				border: "1px solid #22c55e",
				borderRadius: "8px",
				padding: "2px 8px",
				fontWeight: 600,
			},
			appointment: {
				background: "linear-gradient(135deg, #7c3aedcc, #a78bfa)",
				color: "#fff",
				border: "1px solid #5b21b6",
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
				backgroundColor: "#0a0a0a",
				padding: "32px",
				color: "#e0e0e0",
			})}
		>
			<h1
				className={css({
					fontSize: "28px",
					fontWeight: 700,
					color: "#e0d6f0",
					marginBottom: "24px",
					textAlign: "center",
				})}
			>
				Calendar
			</h1>

			<style>{`
				.rbc-calendar { font-family: system-ui, sans-serif; border-radius: 12px; overflow: hidden; background-color: #141414; border: 1px solid #2a2a2a; }
				.rbc-toolbar { padding: 12px; margin-bottom: 0; background-color: #141414; border-bottom: 1px solid #2a2a2a; }
				.rbc-toolbar .rbc-toolbar-label { font-weight: 700; color: #e0e0e0; font-size: 1.1em; }
				.rbc-toolbar button { color: #e0e0e0; border: 1px solid #4c1d95; border-radius: 8px; background: #1e1e1e; padding: 8px 16px; font-weight: 600; cursor: pointer; }
				.rbc-toolbar button:hover { background: #2a2a2a !important; border-color: #7c3aed !important; }
				.rbc-toolbar button:active, .rbc-toolbar button.rbc-active { background-color: #7c3aed !important; color: #fff !important; border-color: #7c3aed !important; }
				.rbc-toolbar button:focus { background-color: #1e1e1e; color: #e0e0e0; }
				.rbc-time-view { border-top: 0; background-color: #141414; }
				.rbc-time-header.rbc-overflowing { border-right: 1px solid #2a2a2a; }
				.rbc-time-header-content { border-left: 1px solid #2a2a2a; }
				.rbc-header { color: #888; background: #141414; padding: 10px 8px; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #2a2a2a; }
				.rbc-label { padding: 0 5px; color: #888; font-size: 11px; }
				.rbc-time-content { border-top: 1px solid #2a2a2a; }
				.rbc-timeslot-group { border-bottom: 1px solid #2a2a2a; min-height: 48px; }
				.rbc-day-slot .rbc-time-slot { border-top: 1px solid #2a2a2a; opacity: 0.3; }
				.rbc-time-gutter .rbc-timeslot-group { border-color: transparent; }
				.rbc-today { background-color: rgba(167,139,250,0.07); }
				.rbc-current-time-indicator { background-color: #7c3aed; height: 2px; }
				.rbc-off-range-bg { background-color: #0f0f0f; }
				.rbc-time-header-gutter.rbc-header { border-right: none; }
				.rbc-month-view, .rbc-month-row, .rbc-time-view, .rbc-time-header, .rbc-time-header-content, .rbc-time-content, .rbc-timeslot-group, .rbc-day-bg, .rbc-day-slot, .rbc-header, .rbc-agenda-view, .rbc-agenda-table, .rbc-agenda-table td, .rbc-agenda-table th { border-color: #2a2a2a !important; }
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
