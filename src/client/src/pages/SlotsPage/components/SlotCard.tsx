import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Tag } from "baseui/tag";
import { useState } from "react";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import type { Slot } from "../hooks/useSlotsPage";

interface Props {
	slot: Slot;
	formatDate: (date: string) => string;
	onDelete: (id: number) => void;
	onToggle: (id: number, currentActive: number) => void;
	onEdit: (slot: Slot) => void;
	t: (key: string) => string;
}

export default function SlotCard({
	slot,
	formatDate,
	onDelete,
	onToggle,
	onEdit,
	t,
}: Props) {
	const [css] = useStyletron();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmMode, setConfirmMode] = useState<"delete" | "disable" | null>(
		null,
	);

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
							fontSize: "18px",
							fontWeight: 700,
							color: "var(--color-text-primary)",
							marginBottom: "4px",
						})}
					>
						{slot.name || t("slots.unnamedSlot")}
					</div>
					<div
						className={css({
							fontWeight: 600,
							color: "var(--color-text-secondary)",
							fontSize: "14px",
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
						onClick={() => onEdit(slot)}
					>
						{t("slots.edit")}
					</Button>
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
