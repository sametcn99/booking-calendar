import { useStyletron } from "baseui";
import type { Slot } from "../hooks/useSlotsPage";
import SlotCard from "./SlotCard";

interface Props {
	formatDate: (d: string) => string;
	onDelete: (id: number) => void;
	onToggle: (id: number, currentActive: number) => void;
	onEdit: (slot: Slot) => void;
	slots: Slot[];
	t: (key: string) => string;
}

export default function SlotsListSection({
	formatDate,
	onDelete,
	onToggle,
	onEdit,
	slots,
	t,
}: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				display: "grid",
				gap: "12px",
			})}
		>
			{slots.length === 0 && (
				<div
					className={css({
						textAlign: "center",
						padding: "48px",
						color: "var(--color-text-tertiary)",
					})}
				>
					{t("slots.empty")}
				</div>
			)}

			{slots.map((slot) => (
				<SlotCard
					key={slot.id}
					slot={slot}
					formatDate={formatDate}
					onToggle={onToggle}
					onDelete={onDelete}
					onEdit={onEdit}
					t={t}
				/>
			))}
		</div>
	);
}
