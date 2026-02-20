import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Input } from "baseui/input";
import { Tag } from "baseui/tag";
import { useState } from "react";
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

	const hasNameChange = nameDraft.trim() !== (slot.name || "").trim();

	return (
		<div
			className={css({
				backgroundColor: "#141414",
				borderRadius: "8px",
				padding: "16px 20px",
				border: "1px solid #2a2a2a",
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
				<div className={css({ fontWeight: 600, color: "#e0d6f0" })}>
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
								backgroundColor: slot.is_active ? "#1a3525" : "#3b1025",
							},
						},
						Text: {
							style: {
								color: slot.is_active ? "#a7f3d0" : "#fca5a5",
							},
						},
					}}
				>
					{slot.is_active ? t("slots.active") : t("slots.inactive")}
				</Tag>
				<Button
					kind={KIND.secondary}
					size={SIZE.compact}
					onClick={() => onToggle(slot.id, slot.is_active)}
				>
					{slot.is_active ? t("slots.disable") : t("slots.enable")}
				</Button>
				<Button
					kind={KIND.secondary}
					size={SIZE.compact}
					onClick={() => onDelete(slot.id)}
					overrides={{
						BaseButton: {
							style: {
								backgroundColor: "#3b1025",
								color: "#fca5a5",
								":hover": { backgroundColor: "#4d1530" },
							},
						},
					}}
				>
					{t("slots.delete")}
				</Button>
			</div>
		</div>
	);
}
