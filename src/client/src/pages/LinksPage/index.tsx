import PageLoadingSpinner from "../../components/PageLoadingSpinner";
import { useI18n } from "../../context/I18nContext";
import CreateLinkModal from "./components/CreateLinkModal";
import LinksHeader from "./components/LinksHeader";
import LinksListSection from "./components/LinksListSection";
import { useLinksPage } from "./hooks/useLinksPage";

export default function LinksPage() {
	const { t, locale } = useI18n();
	const {
		initialLoading,
		copyToClipboard,
		expiresDays,
		generatedUrl,
		handleCreate,
		handleUpdate,
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
		requiresApproval,
		setRequiresApproval,
		editingLink,
		openEditModal,
	} = useLinksPage(t);

	const formatDate = (d: string) =>
		new Date(d).toLocaleString(locale, {
			dateStyle: "medium",
			timeStyle: "short",
		});

	return (
		<div>
			<LinksHeader
				onCreateClick={() => {
					setModalOpen(true);
					setGeneratedUrl("");
					resetCreateForm();
				}}
				t={t}
			/>

			{initialLoading ? (
				<PageLoadingSpinner label={t("common.loading")} />
			) : (
				<LinksListSection
					links={links}
					formatDate={formatDate}
					onCopy={copyToClipboard}
					onDelete={handleDelete}
					onEdit={openEditModal}
					t={t}
				/>
			)}

			<CreateLinkModal
				expiresDays={expiresDays}
				generatedUrl={generatedUrl}
				isOpen={modalOpen}
				linkName={linkName}
				loading={loading}
				onClose={() => setModalOpen(false)}
				onCopyGeneratedUrl={() => copyToClipboard(generatedUrl)}
				onCreate={editingLink ? handleUpdate : handleCreate}
				selectedSlotIds={selectedSlotIds}
				setExpiresDays={setExpiresDays}
				setLinkName={setLinkName}
				locale={locale}
				slots={slots}
				t={t}
				toggleSlotSelection={toggleSlotSelection}
				requiresApproval={requiresApproval}
				setRequiresApproval={setRequiresApproval}
				isEditing={!!editingLink}
			/>
		</div>
	);
}
