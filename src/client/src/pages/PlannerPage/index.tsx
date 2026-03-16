import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import ListFiltersBar from "../../components/ListFilters/ListFiltersBar";
import ListFiltersFeedback from "../../components/ListFilters/ListFiltersFeedback";
import PageLoadingSpinner from "../../components/PageLoadingSpinner";
import { useI18n } from "../../context/I18nContext";
import PlannerEventCard from "./components/PlannerEventCard";
import PlannerEventModal from "./components/PlannerEventModal";
import { usePlannerPage } from "./hooks/usePlannerPage";

export default function PlannerPage() {
	const [css] = useStyletron();
	const { t, locale } = useI18n();
	const {
		initialLoading,
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
		search,
		setSearch,
		sort,
		setSort,
		from,
		setFrom,
		to,
		setTo,
		clearFilters,
		isActive,
		totalCount,
	} = usePlannerPage(t);

	const formatDate = (d: string) =>
		new Date(d).toLocaleString(locale, {
			dateStyle: "medium",
			timeStyle: "short",
		});

	return (
		<div>
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

			{initialLoading ? (
				<PageLoadingSpinner label={t("common.loading")} />
			) : (
				<>
					<div
						className={css({
							display: "flex",
							flexDirection: "column",
							gap: "16px",
							marginBottom: "24px",
						})}
					>
						<div
							className={css({
								display: "flex",
								gap: "8px",
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
								kind={
									statusFilter === "upcoming" ? KIND.primary : KIND.secondary
								}
								size={SIZE.compact}
								onClick={() => setStatusFilter("upcoming")}
							>
								{t("planner.upcoming")}
							</Button>
							<Button
								kind={
									statusFilter === "ongoing" ? KIND.primary : KIND.secondary
								}
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

						<ListFiltersBar
							search={search}
							onSearchChange={setSearch}
							sort={sort}
							onSortChange={setSort}
							from={from}
							onFromChange={setFrom}
							to={to}
							onToChange={setTo}
							onClear={clearFilters}
							isActive={isActive}
							t={t}
						/>
					</div>

					<ListFiltersFeedback
						count={filteredEvents.length}
						totalCount={totalCount}
						isActive={isActive}
						search={search}
						from={from}
						to={to}
						t={t}
					/>

					{filteredEvents.length === 0 ? (
						<div
							className={css({
								textAlign: "center",
								padding: "48px",
								fontSize: "14px",
								color: "var(--color-text-tertiary)",
								backgroundColor: "var(--color-bg-secondary)",
								borderRadius: "12px",
								border: "1px dashed var(--color-border-primary)",
							})}
						>
							{isActive ? t("appointments.empty") : t("planner.empty")}
						</div>
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
				</>
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
