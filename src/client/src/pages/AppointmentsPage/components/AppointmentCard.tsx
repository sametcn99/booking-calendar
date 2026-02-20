import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import type { Appointment } from "../hooks/useAppointmentsPage";

interface Props {
	appointment: Appointment;
	formatDate: (date: string) => string;
	onCancel: (id: number) => void;
	onDelete: (id: number) => void;
	isPast: boolean;
	canDelete: boolean;
	t: (key: string) => string;
}

export default function AppointmentCard({
	appointment,
	formatDate,
	onCancel,
	onDelete,
	isPast,
	canDelete,
	t,
}: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				backgroundColor: "#141414",
				borderRadius: "8px",
				padding: "20px",
				border: "1px solid #2a2a2a",
			})}
		>
			<div
				className={css({
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					gap: "16px",
					flexWrap: "wrap",
				})}
			>
				<div>
					<div
						className={css({
							fontWeight: 700,
							fontSize: "16px",
							color: "#a78bfa",
							marginBottom: "4px",
						})}
					>
						{appointment.name}
					</div>
					<div
						className={css({
							fontSize: "14px",
							color: "#b8a9d4",
							marginBottom: "8px",
						})}
					>
						{appointment.email || t("appointments.noEmail")}
					</div>
					<div
						className={css({
							fontSize: "14px",
							color: "#e0d6f0",
						})}
					>
						{formatDate(appointment.start_at)} -{" "}
						{formatDate(appointment.end_at)}
					</div>
					{isPast && !appointment.canceled_at && (
						<div
							className={css({
								fontSize: "13px",
								color: "#fbbf24",
								marginTop: "8px",
								fontWeight: 600,
							})}
						>
							{t("appointments.pastStatus")}
						</div>
					)}
					{appointment.canceled_at && (
						<div
							className={css({
								fontSize: "13px",
								color: "#fca5a5",
								marginTop: "8px",
								fontWeight: 600,
							})}
						>
							{t("appointments.canceledBy")} (
							{appointment.canceled_by || t("appointments.unknown")})
						</div>
					)}
					{appointment.note && (
						<div
							className={css({
								fontSize: "13px",
								color: "#8b7aab",
								marginTop: "8px",
								fontStyle: "italic",
							})}
						>
							{t("appointments.note")}: {appointment.note}
						</div>
					)}
					{appointment.meeting_place && (
						<div
							className={css({
								fontSize: "13px",
								color: "#8b7aab",
								marginTop: "6px",
							})}
						>
							{t("appointments.meetingPlace")}: {appointment.meeting_place}
						</div>
					)}
				</div>
				<div
					className={css({
						display: "flex",
						gap: "8px",
						alignItems: "center",
					})}
				>
					<Button
						kind={KIND.secondary}
						size={SIZE.compact}
						onClick={() => onCancel(appointment.id)}
						disabled={!!appointment.canceled_at}
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
						{t("appointments.cancelBtn")}
					</Button>
					<Button
						kind={KIND.secondary}
						size={SIZE.compact}
						onClick={() => onDelete(appointment.id)}
						disabled={!canDelete}
						overrides={{
							BaseButton: {
								style: {
									backgroundColor: "#2a1f14",
									color: "#f9a66d",
									":hover": { backgroundColor: "#3a2a1b" },
								},
							},
						}}
					>
						{t("appointments.deleteBtn")}
					</Button>
				</div>
			</div>
		</div>
	);
}
