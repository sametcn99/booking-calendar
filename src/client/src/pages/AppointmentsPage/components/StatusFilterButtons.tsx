import { Button, KIND, SIZE } from "baseui/button";
import type { AppointmentStatusFilter } from "../hooks/useAppointmentsPage";

interface Props {
	statusFilter: AppointmentStatusFilter;
	onChange: (value: AppointmentStatusFilter) => void;
	t: (key: string) => string;
}

export default function StatusFilterButtons({
	statusFilter,
	onChange,
	t,
}: Props) {
	return (
		<>
			<Button
				kind={statusFilter === "all" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => onChange("all")}
			>
				{t("appointments.all")}
			</Button>
			<Button
				kind={statusFilter === "active" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => onChange("active")}
			>
				{t("appointments.active")}
			</Button>
			<Button
				kind={statusFilter === "canceled" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => onChange("canceled")}
			>
				{t("appointments.canceled")}
			</Button>
			<Button
				kind={statusFilter === "past" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => onChange("past")}
			>
				{t("appointments.past")}
			</Button>
		</>
	);
}
