import { PLACEMENT, ToasterContainer } from "baseui/toast";
import { useI18n } from "../../context/I18nContext";
import CreateLinkModal from "./components/CreateLinkModal";
import LinksHeader from "./components/LinksHeader";
import LinksListSection from "./components/LinksListSection";
import { useLinksPage } from "./hooks/useLinksPage";

export default function LinksPage() {
	const { t, locale } = useI18n();
	const {
		copyToClipboard,
		expiresDays,
		generatedUrl,
		handleCreate,
		handleDelete,
		linkName,
		links,
		loading,
		modalOpen,
		resetCreateForm,
		selectedSlotIds,
		setExpiresDays,
		setGeneratedUrl,
		setLinkName,
		setModalOpen,
		slots,
		toggleSlotSelection,
	} = useLinksPage(t);

	const formatDate = (d: string) =>
		new Date(d).toLocaleString(locale, {
			dateStyle: "medium",
			timeStyle: "short",
		});

	return (
		<div>
			<ToasterContainer placement={PLACEMENT.bottomRight} />

			<LinksHeader
				onCreateClick={() => {
					setModalOpen(true);
					setGeneratedUrl("");
					resetCreateForm();
				}}
				t={t}
			/>

			<LinksListSection
				links={links}
				formatDate={formatDate}
				onCopy={copyToClipboard}
				onDelete={handleDelete}
				t={t}
			/>

			<CreateLinkModal
				expiresDays={expiresDays}
				generatedUrl={generatedUrl}
				isOpen={modalOpen}
				linkName={linkName}
				loading={loading}
				onClose={() => setModalOpen(false)}
				onCopyGeneratedUrl={() => copyToClipboard(generatedUrl)}
				onCreate={handleCreate}
				selectedSlotIds={selectedSlotIds}
				setExpiresDays={setExpiresDays}
				setLinkName={setLinkName}
				locale={locale}
				slots={slots}
				t={t}
				toggleSlotSelection={toggleSlotSelection}
			/>
		</div>
	);
}
