import { useStyletron } from "baseui";
import type { SlotStatusFilter } from "../hooks/useSlotsPage";
import SlotStatusFilterButtons from "./SlotStatusFilterButtons";

interface Props {
	onChange: (value: SlotStatusFilter) => void;
	statusFilter: SlotStatusFilter;
	t: (key: string) => string;
}

export default function SlotsFilterSection({
	onChange,
	statusFilter,
	t,
}: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				display: "flex",
				gap: "8px",
				marginBottom: "20px",
				flexWrap: "wrap",
			})}
		>
			<SlotStatusFilterButtons
				statusFilter={statusFilter}
				onChange={onChange}
				t={t}
			/>
		</div>
	);
}
