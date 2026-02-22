import { useStyletron } from "baseui";
import type { AppointmentStatusFilter } from "../hooks/useAppointmentsPage";
import StatusFilterButtons from "./StatusFilterButtons";

interface Props {
	onChange: (value: AppointmentStatusFilter) => void;
	statusFilter: AppointmentStatusFilter;
	pendingCount: number;
	t: (key: string) => string;
}

export default function AppointmentsFilterSection({
	onChange,
	statusFilter,
	pendingCount,
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
				pendingCount={pendingCount}
				t={t}
			/>
		</div>
	);
}
