import { useStyletron } from "baseui";
import type { Dispatch, SetStateAction } from "react";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import { useCommunityEventsSection } from "../hooks/useCommunityEventsSection";
import CommunityEventCard from "./CommunityEventCard";
import CommunityEventCreateModal from "./CommunityEventCreateModal";
import CommunityStatusFilterButtons from "./CommunityStatusFilterButtons";

interface Props {
	showForm: boolean;
	setShowForm: Dispatch<SetStateAction<boolean>>;
	t: (key: string) => string;
}

export default function CommunityEventsSection({
	showForm,
	setShowForm,
	t,
}: Props) {
	const [css] = useStyletron();
	const {
		color,
		confirmDeleteSlugId,
		creating,
		description,
		endAt,
		filteredEvents,
		getShareLink,
		handleConfirmDelete,
		handleCopyLink,
		handleCreate,
		requiredApprovals,
		setColor,
		setConfirmDeleteSlugId,
		setDescription,
		setEndAt,
		setRequiredApprovals,
		setStartAt,
		setStatusFilter,
		setTitle,
		startAt,
		statusFilter,
		title,
	} = useCommunityEventsSection(t);

	return (
		<>
			<CommunityEventCreateModal
				color={color}
				creating={creating}
				description={description}
				endAt={endAt}
				isOpen={showForm}
				onClose={() => setShowForm(false)}
				onCreate={() => handleCreate(() => setShowForm(false))}
				requiredApprovals={requiredApprovals}
				setColor={setColor}
				setDescription={setDescription}
				setEndAt={setEndAt}
				setRequiredApprovals={setRequiredApprovals}
				setStartAt={setStartAt}
				setTitle={setTitle}
				startAt={startAt}
				t={t}
				title={title}
			/>

			<CommunityStatusFilterButtons
				setStatusFilter={setStatusFilter}
				statusFilter={statusFilter}
				t={t}
			/>

			{filteredEvents.length === 0 && (
				<div
					className={css({
						textAlign: "center",
						padding: "48px",
						fontSize: "14px",
						color: "var(--color-text-tertiary)",
					})}
				>
					{t("communityEvents.empty")}
				</div>
			)}

			<div
				className={css({
					display: "grid",
					gap: "10px",
				})}
			>
				{filteredEvents.map((event) => (
					<CommunityEventCard
						key={event.slug_id}
						event={event}
						getShareLink={getShareLink}
						onCopyLink={handleCopyLink}
						onDelete={(slugId) => setConfirmDeleteSlugId(slugId)}
						t={t}
					/>
				))}
			</div>

			<ConfirmationDialog
				isOpen={Boolean(confirmDeleteSlugId)}
				title={t("common.confirmationTitle")}
				message={t("common.confirmDeleteMessage")}
				confirmLabel={t("common.confirm")}
				cancelLabel={t("common.cancel")}
				onConfirm={handleConfirmDelete}
				onClose={() => setConfirmDeleteSlugId(null)}
			/>
		</>
	);
}
