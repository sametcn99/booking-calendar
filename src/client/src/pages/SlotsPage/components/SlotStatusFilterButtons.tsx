import { Button, KIND, SIZE } from "baseui/button";
import type { SlotStatusFilter } from "../hooks/useSlotsPage";

interface Props {
	onChange: (value: SlotStatusFilter) => void;
	statusFilter: SlotStatusFilter;
	t: (key: string) => string;
}

export default function SlotStatusFilterButtons({
	onChange,
	statusFilter,
	t,
}: Props) {
	return (
		<>
			<Button
				kind={statusFilter === "all" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => onChange("all")}
			>
				{t("slots.all")}
			</Button>
			<Button
				kind={statusFilter === "active" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => onChange("active")}
			>
				{t("slots.active")}
			</Button>
			<Button
				kind={statusFilter === "inactive" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => onChange("inactive")}
			>
				{t("slots.inactive")}
			</Button>
		</>
	);
}
