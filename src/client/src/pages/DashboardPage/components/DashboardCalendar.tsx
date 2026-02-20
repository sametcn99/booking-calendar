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
import { LabelMedium } from "baseui/typography";
import { useMemo, useState } from "react";
import type { ApiAppointment, ApiPlannerEvent, ApiSlot } from "../../../api";
import { useI18n } from "../../../context/I18nContext";

const locales = {
	"en-US": enUS,
	"tr-TR": tr,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
});

interface DashboardCalendarProps {
	slots: ApiSlot[];
	appointments: ApiAppointment[];
	plannerEvents: ApiPlannerEvent[];
}

interface CalendarEvent {
	id: number | string;
	title: string;
	start: Date;
	end: Date;
	type: "slot" | "appointment" | "planner";
	data?: ApiSlot | ApiAppointment | ApiPlannerEvent;
}

export default function DashboardCalendar({
	slots,
	appointments,
	plannerEvents,
}: DashboardCalendarProps) {
	const [css, theme] = useStyletron();
	const { language, t } = useI18n();
	const [view, setView] = useState<"month" | "week" | "day">("week");
	const [date, setDate] = useState(new Date());
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
		null,
	);
	const [isOpen, setIsOpen] = useState(false);

	const activeAppointments = useMemo(() => {
		const now = Date.now();
		return appointments.filter((appt) => {
			if (appt.canceled_at) return false;
			return new Date(appt.end_at).getTime() >= now;
		});
	}, [appointments]);

	const events: CalendarEvent[] = [
		...slots.map((slot) => ({
			id: `slot-${slot.id}`,
			title: t("dashboard.calendar.availableSlot"),
			start: new Date(slot.start_at),
			end: new Date(slot.end_at),
			type: "slot" as const,
			data: slot,
		})),
		...activeAppointments.map((appt) => ({
			id: `appt-${appt.id}`,
			title: appt.name,
			start: new Date(appt.start_at),
			end: new Date(appt.end_at),
			type: "appointment" as const,
			data: appt,
		})),
		...plannerEvents.map((ev) => ({
			id: `planner-${ev.id}`,
			title: ev.title,
			start: new Date(ev.start_at),
			end: new Date(ev.end_at),
			type: "planner" as const,
			data: ev,
		})),
	];

	const eventStyleGetter = (event: CalendarEvent) => {
		if (event.type === "slot") {
			return {
				style: {
					background: `linear-gradient(135deg, ${theme.colors.backgroundPositive}20, ${theme.colors.backgroundPositive}3d)`,
					color: theme.colors.contentPositive,
					border: `1px solid ${theme.colors.borderPositive}`,
					borderRadius: "8px",
					padding: "2px 8px",
					fontWeight: 600,
				},
			};
		}

		if (event.type === "planner") {
			const color = (event.data as ApiPlannerEvent)?.color || "#f59e0b";
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

		return {
			style: {
				background: `linear-gradient(135deg, ${theme.colors.accent}cc, ${theme.colors.accent400})`,
				color: theme.colors.contentInversePrimary,
				border: `1px solid ${theme.colors.accent700}`,
				borderRadius: "8px",
				padding: "2px 8px",
				fontWeight: 600,
			},
		};
	};

	const messages = {
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
		showMore: (total: number) => `+${total} ${t("dashboard.calendar.more")}`,
	};

	return (
		<div
			className={css({
				backgroundColor: "#141414",
				padding: "24px",
				borderRadius: "12px",
				boxShadow: theme.lighting.shadow500,
				marginTop: "24px",
				color: theme.colors.contentPrimary,
				border: "1px solid #2a2a2a",
			})}
		>
			<div
				className={css({
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "12px",
					flexWrap: "wrap",
					marginBottom: "14px",
				})}
			>
				<div>
					<h2
						className={css({
							...theme.typography.HeadingSmall,
							marginTop: "0",
							marginBottom: "4px",
						})}
					>
						{t("dashboard.calendar.title")}
					</h2>
					<LabelMedium
						overrides={{
							Block: {
								style: {
									color: theme.colors.contentSecondary,
								},
							},
						}}
					>
						{t("dashboard.calendar.subtitle")}
					</LabelMedium>
				</div>

				<div
					className={css({
						display: "flex",
						gap: "8px",
						flexWrap: "wrap",
					})}
				>
					<div
						className={css({
							padding: "6px 10px",
							borderRadius: "999px",
							fontSize: "13px",
							fontWeight: 600,
							color: theme.colors.contentPositive,
							backgroundColor: `${theme.colors.backgroundPositive}33`,
							border: `1px solid ${theme.colors.borderPositive}`,
						})}
					>
						{t("dashboard.calendar.availableLegend")}: {slots.length}
					</div>
					<div
						className={css({
							padding: "6px 10px",
							borderRadius: "999px",
							fontSize: "13px",
							fontWeight: 600,
							color: "#afb2ecff",
							backgroundColor: theme.colors.accent700,
							border: `1px solid ${theme.colors.accent}`,
						})}
					>
						{t("dashboard.calendar.appointmentsLegend")}:{" "}
						{activeAppointments.length}
					</div>
					<div
						className={css({
							padding: "6px 10px",
							borderRadius: "999px",
							fontSize: "13px",
							fontWeight: 600,
							color: "#fbbf24",
							backgroundColor: "rgba(245,158,11,0.2)",
							border: "1px solid #f59e0b",
						})}
					>
						{t("planner.plannerLegend")}: {plannerEvents.length}
					</div>
				</div>
			</div>

			<style>{`
        .rbc-calendar {
          font-family: ${theme.typography.font400.fontFamily};
          border-radius: 12px;
          overflow: hidden;
          background-color: #141414;
          border: 1px solid #2a2a2a;
        }
        .rbc-toolbar {
          padding: 12px;
          margin-bottom: 0;
          background-color: #141414;
          border-bottom: 1px solid #2a2a2a;
        }
        .rbc-toolbar .rbc-toolbar-label {
          font-weight: 700;
          color: ${theme.colors.contentPrimary};
          font-size: 1.1em;
        }
        .rbc-toolbar button {
          color: ${theme.colors.contentPrimary};
          border: 1px solid #4c1d95;
          border-radius: 8px;
          background: #1e1e1e;
          padding: 8px 16px;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .rbc-toolbar button:hover {
          background: #2a2a2a !important;
          border-color: ${theme.colors.borderSelected} !important;
          color: ${theme.colors.contentAccent} !important;
          transform: translateY(-1px);
        }
        .rbc-toolbar button:active,
        .rbc-toolbar button.rbc-active {
          background-color: ${theme.colors.accent} !important;
          color: ${theme.colors.contentInversePrimary} !important;
          border-color: ${theme.colors.accent} !important;
          box-shadow: ${theme.lighting.shadow400};
        }
        .rbc-toolbar button:focus {
          background-color: ${theme.colors.backgroundTertiary};
          color: ${theme.colors.contentPrimary};
        }
        .rbc-toolbar button.rbc-active:hover {
          background-color: ${theme.colors.accent600} !important;
          color: ${theme.colors.contentInversePrimary} !important;
        }
        .rbc-time-view {
          border-top: 0;
          background-color: #141414;
        }
        .rbc-time-header.rbc-overflowing {
          border-right: 1px solid #2a2a2a;
        }
        .rbc-time-header-content {
          border-left: 1px solid #2a2a2a;
        }
        .rbc-header {
          color: ${theme.colors.contentSecondary};
          background: #141414;
          padding: 10px 8px;
          font-size: 12px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          border-bottom: 1px solid #2a2a2a;
        }
        .rbc-label {
          padding: 0 5px;
          color: ${theme.colors.contentSecondary};
          font-size: 11px;
          font-weight: 500;
        }
        .rbc-time-content {
          border-top: 1px solid #2a2a2a;
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid #2a2a2a;
          min-height: 48px;
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #2a2a2a;
          opacity: 0.3;
        }
        .rbc-time-gutter .rbc-timeslot-group {
          border-color: transparent;
        }
        .rbc-today {
          background-color: ${theme.colors.backgroundAccent}11;
        }
        .rbc-current-time-indicator {
          background-color: ${theme.colors.accent};
          height: 2px;
        }
        .rbc-event {
          box-shadow: ${theme.lighting.shadow400};
        }
        .rbc-off-range-bg {
          background-color: #0f0f0f;
        }
        .rbc-time-header-gutter.rbc-header {
           border-right: none;
        }
        .rbc-month-view,
        .rbc-month-row,
        .rbc-time-view,
        .rbc-time-header,
        .rbc-time-header-content,
        .rbc-time-content,
        .rbc-timeslot-group,
        .rbc-day-bg,
        .rbc-day-slot,
        .rbc-header,
        .rbc-agenda-view,
        .rbc-agenda-table,
        .rbc-agenda-table td,
        .rbc-agenda-table th {
          border-color: #2a2a2a !important;
        }
      `}</style>

			<div className={css({ height: "620px" })}>
				<Calendar
					localizer={localizer}
					events={events}
					startAccessor="start"
					endAccessor="end"
					style={{ height: "100%" }}
					eventPropGetter={eventStyleGetter}
					views={["month", "week", "day"]}
					view={view}
					onView={(nextView) => setView(nextView as "month" | "week" | "day")}
					date={date}
					onNavigate={(newDate) => setDate(newDate)}
					culture={language === "tr" ? "tr-TR" : "en-US"}
					messages={messages}
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
