import { useStyletron } from "baseui";
import type { Dispatch, SetStateAction } from "react";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import ListFiltersBar from "../../../components/ListFilters/ListFiltersBar";
import ListFiltersFeedback from "../../../components/ListFilters/ListFiltersFeedback";
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
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
						gap: "12px",
					})}
				>
					<CommunityStatusFilterButtons
						setStatusFilter={setStatusFilter}
						statusFilter={statusFilter}
						t={t}
					/>
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

			{filteredEvents.length === 0 && (
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
					{isActive
						? t("appointments.empty") // Reuse common empty filter msg or add new
						: t("communityEvents.empty")}
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
