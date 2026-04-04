import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { toaster } from "baseui/toast";
import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { ApiCalDAVRepairAction } from "../../../api";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import type { Appointment } from "../hooks/useAppointmentsPage";

interface Props {
	appointment: Appointment;
	formatDate: (date: string) => string;
	onCancel: (slugId: string) => void;
	onDelete: (slugId: string) => void;
	onApprove: (slugId: string) => void;
	onReject: (slugId: string) => void;
	onRepairCalDAV: (slugId: string, action: ApiCalDAVRepairAction) => void;
	repairingSlugId: string | null;
	repairingAction: ApiCalDAVRepairAction | null;
	isPast: boolean;
	canDelete: boolean;
	t: (key: string) => string;
}

export default function AppointmentCard({
	appointment,
	formatDate,
	onCancel,
	onDelete,
	onApprove,
	onReject,
	onRepairCalDAV,
	repairingSlugId,
	repairingAction,
	isPast,
	canDelete,
	t,
}: Props) {
	const [css] = useStyletron();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmMode, setConfirmMode] = useState<
		"delete" | "cancel" | "reject" | null
	>(null);
	const appointmentLink = appointment.slug_id
		? `${window.location.origin}/appointment/${appointment.slug_id}`
		: null;

	const handleCopyLink = async () => {
		if (!appointmentLink) return;
		await navigator.clipboard.writeText(appointmentLink);
		toaster.positive(t("appointments.linkCopied"), {});
	};

	const handleConfirmDelete = () => {
		if (appointment.slug_id) {
			onDelete(appointment.slug_id);
		}
		setConfirmOpen(false);
	};

	const handleConfirmCancel = () => {
		if (appointment.slug_id) {
			onCancel(appointment.slug_id);
		}
		setConfirmOpen(false);
	};

	const handleConfirmReject = () => {
		if (appointment.slug_id) {
			onReject(appointment.slug_id);
		}
		setConfirmOpen(false);
	};

	const isPending = appointment.status === "pending";
	const hasCalDAVSyncError = appointment.caldav_sync_error !== null;
	const hasCalDAVConflict = appointment.caldav_conflict_state === "detected";
	const repairActions: ApiCalDAVRepairAction[] = hasCalDAVConflict
		? ["retry", "refresh_etag", "force_overwrite"]
		: [];

	return (
		<>
			<div
				className={css({
					backgroundColor: "var(--color-bg-secondary)",
					borderRadius: "8px",
					padding: "20px",
					border: isPending
						? "1px solid var(--color-warning-light)"
						: hasCalDAVConflict || hasCalDAVSyncError
							? "1px solid var(--color-error-text)"
							: "1px solid var(--color-bg-quaternary)",
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
						{isPending && (
							<div
								className={css({
									fontSize: "13px",
									color: "var(--color-warning-light)",
									marginTop: "8px",
									fontWeight: 600,
									display: "inline-flex",
									alignItems: "center",
									gap: "6px",
									backgroundColor: "var(--color-warning-dark-bg)",
									borderRadius: "6px",
									padding: "2px 10px",
								})}
							>
								{t("appointments.pendingApproval")}
							</div>
						)}
						{appointment.status === "rejected" && (
							<div
								className={css({
									fontSize: "13px",
									color: "var(--color-error-text)",
									marginTop: "8px",
									fontWeight: 600,
									display: "inline-flex",
									alignItems: "center",
									gap: "6px",
									backgroundColor: "var(--color-error-bg)",
									borderRadius: "6px",
									padding: "2px 10px",
								})}
							>
								{t("appointments.appointmentRejected")}
							</div>
						)}
						{isPast &&
							!appointment.canceled_at &&
							!isPending &&
							appointment.status !== "rejected" && (
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
						{appointment.caldav_last_synced_at ? (
							<div
								className={css({
									fontSize: "12px",
									color: "var(--color-text-tertiary)",
									marginTop: "6px",
								})}
							>
								{t("appointments.caldavLastSyncedAt")}:{" "}
								{formatDate(appointment.caldav_last_synced_at)}
							</div>
						) : null}
						{hasCalDAVSyncError ? (
							<div
								className={css({
									fontSize: "12px",
									color: "var(--color-error-text)",
									marginTop: "8px",
									padding: "8px 10px",
									borderRadius: "8px",
									backgroundColor: "var(--color-error-bg)",
								})}
							>
								<strong>{t("appointments.caldavSyncError")}:</strong>{" "}
								{appointment.caldav_sync_error}
							</div>
						) : null}
						{hasCalDAVConflict ? (
							<div
								className={css({
									display: "grid",
									gap: "8px",
									fontSize: "12px",
									color: "var(--color-error-text)",
									marginTop: "8px",
									padding: "10px",
									borderRadius: "8px",
									backgroundColor: "var(--color-error-bg)",
								})}
							>
								<div>
									<strong>{t("appointments.caldavConflictTitle")}:</strong>{" "}
									{appointment.caldav_conflict_detail ||
										t("appointments.caldavConflictDetected")}
								</div>
								<div>
									{t("appointments.caldavConflictEtags")}:{" "}
									{appointment.caldav_etag || "-"} /{" "}
									{appointment.caldav_remote_etag || "-"}
								</div>
								<div>
									{t("appointments.caldavConflictCount")}:{" "}
									{appointment.caldav_conflict_count}
								</div>
								{appointment.slug_id ? (
									<div
										className={css({
											display: "flex",
											flexWrap: "wrap",
											gap: "8px",
										})}
									>
										{repairActions.map((action) => (
											<Button
												key={action}
												type="button"
												kind={KIND.secondary}
												size={SIZE.compact}
												onClick={() =>
													onRepairCalDAV(appointment.slug_id as string, action)
												}
												isLoading={
													repairingSlugId === appointment.slug_id &&
													repairingAction === action
												}
											>
												{t(`settings.caldavRepairActionLabel.${action}`)}
											</Button>
										))}
									</div>
								) : null}
							</div>
						) : null}
					</div>
					<div
						className={css({
							display: "flex",
							gap: "8px",
							alignItems: "center",
							flexWrap: "wrap",
						})}
					>
						{isPending && appointment.slug_id && (
							<>
								<Button
									kind={KIND.secondary}
									size={SIZE.compact}
									onClick={() =>
										appointment.slug_id && onApprove(appointment.slug_id)
									}
									overrides={{
										BaseButton: {
											style: {
												backgroundColor: "var(--color-success-bg)",
												color: "var(--color-success-text)",
												":hover": {
													backgroundColor: "var(--color-success-hover)",
												},
											},
										},
									}}
								>
									{t("appointments.approveBtn")}
								</Button>
								<Button
									kind={KIND.secondary}
									size={SIZE.compact}
									onClick={() => {
										setConfirmMode("reject");
										setConfirmOpen(true);
									}}
									overrides={{
										BaseButton: {
											style: {
												backgroundColor: "var(--color-error-bg)",
												color: "var(--color-error-text)",
												":hover": {
													backgroundColor: "var(--color-error-hover)",
												},
											},
										},
									}}
								>
									{t("appointments.rejectBtn")}
								</Button>
							</>
						)}
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
							onClick={() => {
								setConfirmMode("cancel");
								setConfirmOpen(true);
							}}
							disabled={!!appointment.canceled_at || !appointment.slug_id}
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
							onClick={() => {
								setConfirmMode("delete");
								setConfirmOpen(true);
							}}
							disabled={!canDelete || !appointment.slug_id}
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

			<ConfirmationDialog
				isOpen={confirmOpen}
				title={t("common.confirmationTitle")}
				message={
					confirmMode === "cancel"
						? t("common.confirmCancelMessage")
						: confirmMode === "reject"
							? t("common.confirmRejectMessage")
							: t("common.confirmDeleteMessage")
				}
				confirmLabel={t("common.confirm")}
				cancelLabel={t("common.cancel")}
				onConfirm={
					confirmMode === "cancel"
						? handleConfirmCancel
						: confirmMode === "reject"
							? handleConfirmReject
							: handleConfirmDelete
				}
				onClose={() => {
					setConfirmOpen(false);
					setConfirmMode(null);
				}}
			/>
		</>
	);
}
