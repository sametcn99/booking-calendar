import { PLACEMENT, ToasterContainer } from "baseui/toast";
import { useI18n } from "../../context/I18nContext";
import CreateSlotModal from "./components/CreateSlotModal";
import SlotsFilterSection from "./components/SlotsFilterSection";
import SlotsHeader from "./components/SlotsHeader";
import SlotsListSection from "./components/SlotsListSection";
import { useSlotsPage } from "./hooks/useSlotsPage";

export default function SlotsPage() {
	const { t, locale } = useI18n();
	const {
		endAt,
		filteredSlots,
		handleCreate,
		handleDelete,
		handleRename,
		handleToggle,
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

			<SlotsFilterSection
				statusFilter={statusFilter}
				onChange={setStatusFilter}
				t={t}
			/>

			<SlotsListSection
				slots={filteredSlots}
				formatDate={formatDate}
				onToggle={handleToggle}
				onRename={handleRename}
				onDelete={handleDelete}
				t={t}
			/>

			<CreateSlotModal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				startAt={startAt}
				endAt={endAt}
				setStartAt={setStartAt}
				setEndAt={setEndAt}
				slotName={slotName}
				setSlotName={setSlotName}
				onCreate={handleCreate}
				loading={loading}
				t={t}
			/>
		</div>
	);
}
