import { useStyletron } from "baseui";
import { PLACEMENT, ToasterContainer } from "baseui/toast";
import ListFiltersBar from "../../components/ListFilters/ListFiltersBar";
import ListFiltersFeedback from "../../components/ListFilters/ListFiltersFeedback";
import PageLoadingSpinner from "../../components/PageLoadingSpinner";
import { useI18n } from "../../context/I18nContext";
import CreateSlotModal from "./components/CreateSlotModal";
import SlotsFilterSection from "./components/SlotsFilterSection";
import SlotsHeader from "./components/SlotsHeader";
import SlotsListSection from "./components/SlotsListSection";
import { useSlotsPage } from "./hooks/useSlotsPage";

export default function SlotsPage() {
	const [css] = useStyletron();
	const { t, locale } = useI18n();
	const {
		initialLoading,
		endAt,
		handleCreate,
		handleUpdate,
		handleDelete,
		handleToggle,
		filteredSlots,
		loading,
		modalOpen,
		setEndAt,
		setModalOpen,
		setStatusFilter,
		setSlotName,
		setStartAt,
		slotName,
		startAt,
		statusFilter,
		editingSlot,
		openEditModal,
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
	} = useSlotsPage(t);

	const formatDate = (d: string) =>
		new Date(d).toLocaleString(locale, {
			dateStyle: "medium",
			timeStyle: "short",
		});

	return (
		<div>
			<ToasterContainer placement={PLACEMENT.bottomRight} />

			<SlotsHeader onAddClick={() => setModalOpen(true)} t={t} />

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
						<SlotsFilterSection
							statusFilter={statusFilter}
							onChange={setStatusFilter}
							t={t}
						/>

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
						count={filteredSlots.length}
						totalCount={totalCount}
						isActive={isActive}
						search={search}
						from={from}
						to={to}
						t={t}
					/>

					{filteredSlots.length === 0 && isActive ? (
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
							{t("common.noResults")}
						</div>
					) : (
						<SlotsListSection
							slots={filteredSlots}
							formatDate={formatDate}
							onToggle={handleToggle}
							onDelete={handleDelete}
							onEdit={openEditModal}
							t={t}
						/>
					)}
				</>
			)}

			<CreateSlotModal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				startAt={startAt}
				endAt={endAt}
				setStartAt={setStartAt}
				setEndAt={setEndAt}
				slotName={slotName}
				setSlotName={setSlotName}
				onCreate={editingSlot ? handleUpdate : handleCreate}
				loading={loading}
				t={t}
				isEditing={!!editingSlot}
			/>
		</div>
	);
}
