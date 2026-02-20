import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { PLACEMENT, ToasterContainer } from "baseui/toast";
import { useI18n } from "../../context/I18nContext";
import PlannerEventCard from "./components/PlannerEventCard";
import PlannerEventModal from "./components/PlannerEventModal";
import { usePlannerPage } from "./hooks/usePlannerPage";

export default function PlannerPage() {
	const [css] = useStyletron();
	const { t, locale } = useI18n();
	const {
		editingEvent,
		filteredEvents,
		form,
		handleDelete,
		handleSave,
		loading,
		modalOpen,
		openCreate,
		openEdit,
		setModalOpen,
		setStatusFilter,
		statusFilter,
		updateForm,
	} = usePlannerPage(t);

	const formatDate = (d: string) =>
		new Date(d).toLocaleString(locale, {
			dateStyle: "medium",
			timeStyle: "short",
		});

	return (
		<div>
			<ToasterContainer placement={PLACEMENT.bottomRight} />

			<div
				className={css({
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					marginBottom: "24px",
					gap: "16px",
				})}
			>
				<div>
					<h1
						className={css({
							fontSize: "28px",
							fontWeight: 700,
							color: "var(--color-text-primary)",
							marginTop: 0,
							marginBottom: "8px",
						})}
					>
						{t("planner.title")}
					</h1>
					<p
						className={css({
							fontSize: "14px",
							lineHeight: 1.5,
							color: "var(--color-text-subtle)",
							margin: 0,
							maxWidth: "760px",
						})}
					>
						{t("planner.pageDescription")}
					</p>
				</div>
				<Button onClick={openCreate}>{t("planner.addEvent")}</Button>
			</div>

			<div
				className={css({
					display: "flex",
					gap: "8px",
					marginBottom: "20px",
					flexWrap: "wrap",
				})}
			>
				<Button
					kind={statusFilter === "all" ? KIND.primary : KIND.secondary}
					size={SIZE.compact}
					onClick={() => setStatusFilter("all")}
				>
					{t("planner.all")}
				</Button>
				<Button
					kind={statusFilter === "upcoming" ? KIND.primary : KIND.secondary}
					size={SIZE.compact}
					onClick={() => setStatusFilter("upcoming")}
				>
					{t("planner.upcoming")}
				</Button>
				<Button
					kind={statusFilter === "ongoing" ? KIND.primary : KIND.secondary}
					size={SIZE.compact}
					onClick={() => setStatusFilter("ongoing")}
				>
					{t("planner.ongoing")}
				</Button>
				<Button
					kind={statusFilter === "past" ? KIND.primary : KIND.secondary}
					size={SIZE.compact}
					onClick={() => setStatusFilter("past")}
				>
					{t("planner.past")}
				</Button>
			</div>

			{filteredEvents.length === 0 ? (
				<p
					className={css({
						color: "var(--color-text-muted)",
						textAlign: "center",
						padding: "48px 0",
					})}
				>
					{t("planner.empty")}
				</p>
			) : (
				<div
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "12px",
					})}
				>
					{filteredEvents.map((event) => (
						<PlannerEventCard
							key={event.id}
							event={event}
							formatDate={formatDate}
							onEdit={openEdit}
							onDelete={handleDelete}
							t={t}
						/>
					))}
				</div>
			)}

			<PlannerEventModal
				isOpen={modalOpen}
				isEdit={!!editingEvent}
				form={form}
				loading={loading}
				onClose={() => setModalOpen(false)}
				onSave={handleSave}
				updateForm={updateForm}
				t={t}
			/>
		</div>
	);
}
