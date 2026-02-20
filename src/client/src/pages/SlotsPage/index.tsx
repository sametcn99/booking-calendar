import { PLACEMENT, ToasterContainer } from "baseui/toast";
import { useI18n } from "../../context/I18nContext";
import CreateSlotModal from "./components/CreateSlotModal";
import SlotsHeader from "./components/SlotsHeader";
import SlotsListSection from "./components/SlotsListSection";
import { useSlotsPage } from "./hooks/useSlotsPage";

export default function SlotsPage() {
	const { t, locale } = useI18n();
	const {
		endAt,
		handleCreate,
		handleDelete,
		handleRename,
		handleToggle,
		loading,
		modalOpen,
		setEndAt,
		setModalOpen,
		setSlotName,
		setStartAt,
		slotName,
		slots,
		startAt,
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

			<SlotsListSection
				slots={slots}
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
