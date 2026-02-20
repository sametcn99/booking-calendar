import { useStyletron } from "baseui";
import { Button } from "baseui/button";
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
		events,
		form,
		handleDelete,
		handleSave,
		loading,
		modalOpen,
		openCreate,
		openEdit,
		setModalOpen,
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
					alignItems: "center",
					marginBottom: "24px",
				})}
			>
				<h1
					className={css({
						fontSize: "28px",
						fontWeight: 700,
						color: "#e0d6f0",
					})}
				>
					{t("planner.title")}
				</h1>
				<Button onClick={openCreate}>{t("planner.addEvent")}</Button>
			</div>

			{events.length === 0 ? (
				<p
					className={css({
						color: "#888",
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
					{events.map((event) => (
						<PlannerEventCard
							key={event.id}
							event={event}
							formatDate={formatDate}
							onEdit={openEdit}
							onDelete={handleDelete}
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
