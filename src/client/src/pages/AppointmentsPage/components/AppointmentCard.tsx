import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { toaster } from "baseui/toast";
import { Copy, ExternalLink } from "lucide-react";
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
	const appointmentLink = appointment.cancel_token
		? `${window.location.origin}/appointment/${appointment.cancel_token}`
		: null;

	const handleCopyLink = async () => {
		if (!appointmentLink) return;
		await navigator.clipboard.writeText(appointmentLink);
		toaster.positive(t("appointments.linkCopied"), {});
	};

	return (
		<div
			className={css({
				backgroundColor: "var(--color-bg-secondary)",
				borderRadius: "8px",
				padding: "20px",
				border: "1px solid var(--color-bg-quaternary)",
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
							color: "var(--color-accent-800)",
							marginBottom: "4px",
						})}
					>
						{appointment.name}
					</div>
					<div
						className={css({
							fontSize: "14px",
							color: "var(--color-text-secondary)",
							marginBottom: "8px",
						})}
					>
						{appointment.email || t("appointments.noEmail")}
					</div>
					<div
						className={css({
							fontSize: "14px",
							color: "var(--color-text-primary)",
						})}
					>
						{formatDate(appointment.start_at)} -{" "}
						{formatDate(appointment.end_at)}
					</div>
					{isPast && !appointment.canceled_at && (
						<div
							className={css({
								fontSize: "13px",
								color: "var(--color-warning-light)",
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
								color: "var(--color-error-text)",
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
								color: "var(--color-text-tertiary)",
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
								color: "var(--color-text-tertiary)",
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
						flexWrap: "wrap",
					})}
				>
					{appointmentLink && (
						<>
							<Button
								kind={KIND.secondary}
								size={SIZE.compact}
								onClick={() => window.open(appointmentLink, "_blank")}
							>
								<ExternalLink size={14} />
								<span className={css({ marginLeft: "6px" })}>
									{t("appointments.openLink")}
								</span>
							</Button>
							<Button
								kind={KIND.secondary}
								size={SIZE.compact}
								onClick={handleCopyLink}
							>
								<Copy size={14} />
							</Button>
						</>
					)}
					<Button
						kind={KIND.secondary}
						size={SIZE.compact}
						onClick={() => onCancel(appointment.id)}
						disabled={!!appointment.canceled_at}
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
									backgroundColor: "var(--color-warning-dark-bg)",
									color: "var(--color-warning-light)",
									":hover": {
										backgroundColor: "var(--color-warning-dark-hover)",
									},
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
