import { useStyletron } from "baseui";
import type { AppointmentStatusFilter } from "../hooks/useAppointmentsPage";
import StatusFilterButtons from "./StatusFilterButtons";

interface Props {
	onChange: (value: AppointmentStatusFilter) => void;
	statusFilter: AppointmentStatusFilter;
	t: (key: string) => string;
}

export default function AppointmentsFilterSection({
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
			<StatusFilterButtons
				statusFilter={statusFilter}
				onChange={onChange}
				t={t}
			/>
		</div>
	);
}
