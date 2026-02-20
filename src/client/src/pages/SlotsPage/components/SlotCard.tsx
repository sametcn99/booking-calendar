import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Input } from "baseui/input";
import { Tag } from "baseui/tag";
import { useState } from "react";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import type { Slot } from "../hooks/useSlotsPage";

interface Props {
	slot: Slot;
	formatDate: (date: string) => string;
	onDelete: (id: number) => void;
	onRename: (id: number, name: string) => void;
	onToggle: (id: number, currentActive: number) => void;
	t: (key: string) => string;
}

export default function SlotCard({
	slot,
	formatDate,
	onDelete,
	onRename,
	onToggle,
	t,
}: Props) {
	const [css] = useStyletron();
	const [nameDraft, setNameDraft] = useState(slot.name || "");
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmMode, setConfirmMode] = useState<"delete" | "disable" | null>(
		null,
	);

	const hasNameChange = nameDraft.trim() !== (slot.name || "").trim();

	const openDeleteConfirmation = () => {
		setConfirmMode("delete");
		setConfirmOpen(true);
	};

	const openDisableConfirmation = () => {
		setConfirmMode("disable");
		setConfirmOpen(true);
	};

	const handleConfirm = () => {
		if (confirmMode === "delete") {
			onDelete(slot.id);
		}
		if (confirmMode === "disable") {
			onToggle(slot.id, slot.is_active);
		}
		setConfirmOpen(false);
		setConfirmMode(null);
	};

	const handleCloseConfirm = () => {
		setConfirmOpen(false);
		setConfirmMode(null);
	};

	return (
		<>
			<div
				className={css({
					backgroundColor: "var(--color-bg-secondary)",
					borderRadius: "8px",
					padding: "16px 20px",
					border: "1px solid var(--color-bg-quaternary)",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "16px",
					flexWrap: "wrap",
				})}
			>
				<div className={css({ flex: 1, minWidth: "240px" })}>
					<div
						className={css({
							display: "flex",
							gap: "8px",
							alignItems: "center",
							marginBottom: "8px",
						})}
					>
						<Input
							value={nameDraft}
							placeholder={t("slots.namePlaceholder")}
							onChange={(e) => setNameDraft(e.currentTarget.value)}
							overrides={{
								Root: {
									style: { maxWidth: "260px" },
								},
							}}
						/>
						<Button
							kind={KIND.secondary}
							size={SIZE.compact}
							onClick={() => onRename(slot.id, nameDraft)}
							disabled={!hasNameChange}
						>
							{t("slots.saveName")}
						</Button>
					</div>
					<div
						className={css({
							fontWeight: 600,
							color: "var(--color-text-primary)",
						})}
					>
						{formatDate(slot.start_at)} - {formatDate(slot.end_at)}
					</div>
				</div>
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "8px",
					})}
				>
					<Tag
						closeable={false}
						overrides={{
							Root: {
								style: {
									backgroundColor: slot.is_active
										? "var(--color-success-bg)"
										: "var(--color-error-bg)",
								},
							},
							Text: {
								style: {
									color: slot.is_active
										? "var(--color-success-text)"
										: "var(--color-error-text)",
								},
							},
						}}
					>
						{slot.is_active ? t("slots.active") : t("slots.inactive")}
					</Tag>
					<Button
						kind={KIND.secondary}
						size={SIZE.compact}
						onClick={() => {
							if (slot.is_active) {
								openDisableConfirmation();
								return;
							}
							onToggle(slot.id, slot.is_active);
						}}
					>
						{slot.is_active ? t("slots.disable") : t("slots.enable")}
					</Button>
					<Button
						kind={KIND.secondary}
						size={SIZE.compact}
						onClick={openDeleteConfirmation}
						overrides={{
							BaseButton: {
								style: {
									backgroundColor: "var(--color-error-bg)",
									color: "var(--color-error-text)",
									":hover": { backgroundColor: "var(--color-error-hover)" },
								},
							},
						}}
					>
						{t("slots.delete")}
					</Button>
				</div>
			</div>

			<ConfirmationDialog
				isOpen={confirmOpen}
				title={t("common.confirmationTitle")}
				message={
					confirmMode === "disable"
						? t("common.confirmDisableMessage")
						: t("common.confirmDeleteMessage")
				}
				confirmLabel={t("common.confirm")}
				cancelLabel={t("common.cancel")}
				onConfirm={handleConfirm}
				onClose={handleCloseConfirm}
			/>
		</>
	);
}
