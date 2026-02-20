import { useStyletron } from "baseui";
import { useI18n } from "../../context/I18nContext";
import EventDetailsModal from "./components/EventDetailsModal";
import PublicCalendarView from "./components/PublicCalendarView";
import { usePublicCalendarPage } from "./hooks/usePublicCalendarPage";

export default function PublicCalendarPage() {
	const [css] = useStyletron();
	const { language, t } = useI18n();
	const {
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
	} = usePublicCalendarPage(t);

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

			<div
				className={css({
					height: "700px",
					maxWidth: "1200px",
					margin: "0 auto",
				})}
			>
				<PublicCalendarView
					culture={language === "tr" ? "tr-TR" : "en-US"}
					date={date}
					eventStyleGetter={eventStyleGetter}
					events={events}
					onNavigate={setDate}
					onSelectEvent={handleSelectEvent}
					onView={setView}
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
					view={view}
				/>
			</div>

			<EventDetailsModal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				selectedEvent={selectedEvent}
				t={t}
			/>
		</div>
	);
}
