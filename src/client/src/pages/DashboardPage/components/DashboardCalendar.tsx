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
import type {
	ApiAppointment,
	ApiCommunityEvent,
	ApiPlannerEvent,
	ApiSlot,
} from "../../../api";
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
	communityEvents: ApiCommunityEvent[];
}

interface CalendarEvent {
	id: number | string;
	title: string;
	start: Date;
	end: Date;
	type: "slot" | "appointment" | "planner" | "community";
	data?: ApiSlot | ApiAppointment | ApiPlannerEvent | ApiCommunityEvent;
}

export default function DashboardCalendar({
	slots,
	appointments,
	plannerEvents,
	communityEvents,
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

	const [visibleTypes, setVisibleTypes] = useState<Set<string>>(
		new Set(["slot", "appointment", "planner", "community"]),
	);

	const toggleType = (type: string) => {
		const next = new Set(visibleTypes);
		if (next.has(type)) {
			next.delete(type);
		} else {
			next.add(type);
		}
		setVisibleTypes(next);
	};

	const events = useMemo(() => {
		const allEvents: CalendarEvent[] = [];

		if (visibleTypes.has("slot")) {
			allEvents.push(
				...slots.map((slot) => ({
					id: `slot-${slot.id}`,
					title: t("dashboard.calendar.availableSlot"),
					start: new Date(slot.start_at),
					end: new Date(slot.end_at),
					type: "slot" as const,
					data: slot,
				})),
			);
		}

		if (visibleTypes.has("appointment")) {
			allEvents.push(
				...activeAppointments.map((appt) => ({
					id: `appt-${appt.id}`,
					title: appt.name,
					start: new Date(appt.start_at),
					end: new Date(appt.end_at),
					type: "appointment" as const,
					data: appt,
				})),
			);
		}

		if (visibleTypes.has("planner")) {
			allEvents.push(
				...plannerEvents.map((ev) => ({
					id: `planner-${ev.id}`,
					title: ev.title,
					start: new Date(ev.start_at),
					end: new Date(ev.end_at),
					type: "planner" as const,
					data: ev,
				})),
			);
		}

		if (visibleTypes.has("community")) {
			allEvents.push(
				...communityEvents.map((ev) => ({
					id: `community-${ev.id}`,
					title: ev.title,
					start: new Date(ev.start_at),
					end: new Date(ev.end_at),
					type: "community" as const,
					data: ev,
				})),
			);
		}

		return allEvents;
	}, [
		slots,
		activeAppointments,
		plannerEvents,
		communityEvents,
		visibleTypes,
		t,
	]);

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
			const color =
				(event.data as ApiPlannerEvent)?.color || "var(--color-warning)";
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
				backgroundColor: "var(--color-bg-secondary)",
				padding: "24px",
				borderRadius: "12px",
				boxShadow: theme.lighting.shadow500,
				marginTop: "24px",
				color: theme.colors.contentPrimary,
				border: "1px solid var(--color-bg-quaternary)",
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
					<button
						type="button"
						onClick={() => toggleType("slot")}
						className={css({
							padding: "6px 14px",
							borderRadius: "999px",
							fontSize: "13px",
							fontWeight: 600,
							color: theme.colors.contentPositive,
							backgroundColor: visibleTypes.has("slot")
								? `${theme.colors.backgroundPositive}33`
								: "transparent",
							border: `1px solid ${
								visibleTypes.has("slot")
									? theme.colors.borderPositive
									: theme.colors.borderOpaque
							}`,
							cursor: "pointer",
							transition: "all 0.2s ease",
							display: "flex",
							alignItems: "center",
							gap: "6px",
							opacity: visibleTypes.has("slot") ? 1 : 0.6,
							outline: "none",
							":focus": {
								boxShadow: `0 0 0 2px ${theme.colors.accent}`,
							},
							":hover": {
								backgroundColor: `${theme.colors.backgroundPositive}4d`,
								transform: "translateY(-1px)",
							},
						})}
					>
						<div
							className={css({
								width: "8px",
								height: "8px",
								borderRadius: "50%",
								backgroundColor: theme.colors.backgroundPositive,
							})}
						/>
						{t("dashboard.calendar.availableLegend")}: {slots.length}
					</button>

					<button
						type="button"
						onClick={() => toggleType("appointment")}
						className={css({
							padding: "6px 14px",
							borderRadius: "999px",
							fontSize: "13px",
							fontWeight: 600,
							color: "var(--color-text-secondary)",
							backgroundColor: visibleTypes.has("appointment")
								? theme.colors.accent700
								: "transparent",
							border: `1px solid ${
								visibleTypes.has("appointment")
									? theme.colors.accent
									: theme.colors.borderOpaque
							}`,
							cursor: "pointer",
							transition: "all 0.2s ease",
							display: "flex",
							alignItems: "center",
							gap: "6px",
							opacity: visibleTypes.has("appointment") ? 1 : 0.6,
							outline: "none",
							":focus": {
								boxShadow: `0 0 0 2px ${theme.colors.accent}`,
							},
							":hover": {
								backgroundColor: theme.colors.accent600,
								transform: "translateY(-1px)",
							},
						})}
					>
						<div
							className={css({
								width: "8px",
								height: "8px",
								borderRadius: "50%",
								backgroundColor: theme.colors.accent,
							})}
						/>
						{t("dashboard.calendar.appointmentsLegend")}:{" "}
						{activeAppointments.length}
					</button>

					<button
						type="button"
						onClick={() => toggleType("planner")}
						className={css({
							padding: "6px 14px",
							borderRadius: "999px",
							fontSize: "13px",
							fontWeight: 600,
							color: "var(--color-warning-light)",
							backgroundColor: visibleTypes.has("planner")
								? "var(--color-warning-bg)"
								: "transparent",
							border: `1px solid ${
								visibleTypes.has("planner")
									? "var(--color-warning)"
									: theme.colors.borderOpaque
							}`,
							cursor: "pointer",
							transition: "all 0.2s ease",
							display: "flex",
							alignItems: "center",
							gap: "6px",
							opacity: visibleTypes.has("planner") ? 1 : 0.6,
							outline: "none",
							":focus": {
								boxShadow: `0 0 0 2px ${theme.colors.accent}`,
							},
							":hover": {
								backgroundColor: "var(--color-warning-bg)",
								opacity: 0.9,
								transform: "translateY(-1px)",
							},
						})}
					>
						<div
							className={css({
								width: "8px",
								height: "8px",
								borderRadius: "50%",
								backgroundColor: "var(--color-warning)",
							})}
						/>
						{t("planner.plannerLegend")}: {plannerEvents.length}
					</button>

					<button
						type="button"
						onClick={() => toggleType("community")}
						className={css({
							padding: "6px 14px",
							borderRadius: "999px",
							fontSize: "13px",
							fontWeight: 600,
							color: "var(--color-error)",
							backgroundColor: visibleTypes.has("community")
								? "var(--color-error-bg)"
								: "transparent",
							border: `1px solid ${
								visibleTypes.has("community")
									? "var(--color-error)"
									: theme.colors.borderOpaque
							}`,
							cursor: "pointer",
							transition: "all 0.2s ease",
							display: "flex",
							alignItems: "center",
							gap: "6px",
							opacity: visibleTypes.has("community") ? 1 : 0.6,
							outline: "none",
							":focus": {
								boxShadow: `0 0 0 2px ${theme.colors.accent}`,
							},
							":hover": {
								backgroundColor: "var(--color-error-bg)",
								opacity: 0.9,
								transform: "translateY(-1px)",
							},
						})}
					>
						<div
							className={css({
								width: "8px",
								height: "8px",
								borderRadius: "50%",
								backgroundColor: "var(--color-error)",
							})}
						/>
						{t("communityEvents.title")}: {communityEvents.length}
					</button>
				</div>
				<div
					className={css({
						width: "100%",
						display: "flex",
						justifyContent: "flex-end",
						marginTop: "8px",
					})}
				>
					<LabelMedium
						overrides={{
							Block: {
								style: {
									color: theme.colors.contentTertiary,
									fontSize: "12px",
									fontStyle: "italic",
								},
							},
						}}
					>
						{t("dashboard.calendar.filterHint")}
					</LabelMedium>
				</div>
			</div>

			<style>{`
        .rbc-calendar {
          font-family: ${theme.typography.font400.fontFamily};
          border-radius: 12px;
          overflow: hidden;
          background-color: var(--color-bg-secondary);
          border: 1px solid var(--color-bg-quaternary);
        }
        .rbc-toolbar {
          padding: 12px;
          margin-bottom: 0;
          background-color: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-bg-quaternary);
        }
        .rbc-toolbar .rbc-toolbar-label {
          font-weight: 700;
          color: ${theme.colors.contentPrimary};
          font-size: 1.1em;
        }
        .rbc-toolbar button {
          color: ${theme.colors.contentPrimary};
          border: 1px solid var(--color-accent-300);
          border-radius: 8px;
          background: var(--color-bg-tertiary);
          padding: 8px 16px;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          box-shadow: 0 2px 4px color-mix(in srgb, black 20%, transparent);
        }
        .rbc-toolbar button:hover {
          background: var(--color-bg-quaternary) !important;
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
          background-color: var(--color-bg-secondary);
        }
        .rbc-time-header.rbc-overflowing {
          border-right: 1px solid var(--color-bg-quaternary);
        }
        .rbc-time-header-content {
          border-left: 1px solid var(--color-bg-quaternary);
        }
        .rbc-header {
          color: ${theme.colors.contentSecondary};
          background: var(--color-bg-secondary);
          padding: 10px 8px;
          font-size: 12px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          border-bottom: 1px solid var(--color-bg-quaternary);
        }
        .rbc-label {
          padding: 0 5px;
          color: ${theme.colors.contentSecondary};
          font-size: 11px;
          font-weight: 500;
        }
        .rbc-time-content {
          border-top: 1px solid var(--color-bg-quaternary);
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid var(--color-bg-quaternary);
          min-height: 48px;
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid var(--color-bg-quaternary);
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
          background-color: var(--color-bg-off-range);
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
          border-color: var(--color-bg-quaternary) !important;
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
					{selectedEvent?.type === "community" && (
						<div>
							<p>
								<strong>{t("communityEvents.eventTitle")}:</strong>{" "}
								{(selectedEvent.data as ApiCommunityEvent).title}
							</p>
							{(selectedEvent.data as ApiCommunityEvent).description && (
								<p>
									<strong>{t("communityEvents.description")}:</strong>{" "}
									{(selectedEvent.data as ApiCommunityEvent).description}
								</p>
							)}
							<p>
								<strong>{t("communityEvents.approvals")}:</strong>{" "}
								{(selectedEvent.data as ApiCommunityEvent).current_approvals} /{" "}
								{(selectedEvent.data as ApiCommunityEvent).required_approvals}
							</p>
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
