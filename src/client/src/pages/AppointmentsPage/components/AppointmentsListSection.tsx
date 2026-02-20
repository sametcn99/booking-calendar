import { useStyletron } from "baseui";
import type { Appointment } from "../hooks/useAppointmentsPage";
import AppointmentCard from "./AppointmentCard";

interface Props {
	appointments: Appointment[];
	formatDate: (d: string) => string;
	onCancel: (id: number) => void;
	onDelete: (id: number) => void;
	isPastAppointment: (appointment: Appointment) => boolean;
	canDeleteAppointment: (appointment: Appointment) => boolean;
	t: (key: string) => string;
}

export default function AppointmentsListSection({
	appointments,
	formatDate,
	onCancel,
	onDelete,
	isPastAppointment,
	canDeleteAppointment,
	t,
}: Props) {
	const [css] = useStyletron();

	return (
		<div className={css({ display: "grid", gap: "12px" })}>
			{appointments.length === 0 && (
				<div
					className={css({
						textAlign: "center",
						padding: "48px",
						color: "var(--color-text-tertiary)",
					})}
				>
					{t("appointments.empty")}
				</div>
			)}

			{appointments.map((apt) => (
				<AppointmentCard
					key={apt.id}
					appointment={apt}
					formatDate={formatDate}
					onCancel={onCancel}
					onDelete={onDelete}
					isPast={isPastAppointment(apt)}
					canDelete={canDeleteAppointment(apt)}
					t={t}
				/>
			))}
		</div>
	);
}
