import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { PLACEMENT, ToasterContainer, toaster } from "baseui/toast";
import { Copy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { type ApiAppointment, api } from "../../api";
import { useI18n } from "../../context/I18nContext";

export default function AppointmentDetailPage() {
	const [css] = useStyletron();
	const { t, locale } = useI18n();
	const { token } = useParams<{ token: string }>();
	const [appointment, setAppointment] = useState<ApiAppointment | null>(null);
	const [loading, setLoading] = useState(true);
	const [canceling, setCanceling] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const appointmentLink = useMemo(() => {
		if (!token) return "";
		return `${window.location.origin}/appointment/${token}`;
	}, [token]);

	const load = useCallback(async () => {
		if (!token) {
			setError(t("booking.invalidMessage"));
			setLoading(false);
			return;
		}

		try {
			const result = await api.getPublicAppointment(token);
			setAppointment(result.data);
			setError(null);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : t("common.error"));
		} finally {
			setLoading(false);
		}
	}, [t, token]);

	useEffect(() => {
		load();
	}, [load]);

	const handleCancel = async () => {
		if (!token || !appointment || appointment.canceled_at) return;
		setCanceling(true);
		try {
			const result = await api.cancelPublicAppointment(token);
			setAppointment(result.data);
			toaster.positive(t("appointments.appointmentCanceled"), {});
		} catch (err: unknown) {
			toaster.negative(
				err instanceof Error ? err.message : t("common.error"),
				{},
			);
		} finally {
			setCanceling(false);
		}
	};

	const handleCopyLink = async () => {
		if (!appointmentLink) return;
		await navigator.clipboard.writeText(appointmentLink);
		toaster.positive(t("appointments.linkCopied"), {});
	};

	if (loading) {
		return (
			<div
				className={css({
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
					backgroundColor: "var(--color-bg-primary)",
					color: "var(--color-text-muted)",
					fontSize: "18px",
				})}
			>
				{t("booking.loading")}
			</div>
		);
	}

	if (error || !appointment) {
		return (
			<div
				className={css({
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
					backgroundColor: "var(--color-bg-primary)",
					color: "var(--color-error-text)",
					fontSize: "16px",
					padding: "24px",
					textAlign: "center",
				})}
			>
				{error || t("common.error")}
			</div>
		);
	}

	const isCanceled = Boolean(appointment.canceled_at);

	return (
		<div
			className={css({
				minHeight: "100vh",
				backgroundColor: "var(--color-bg-primary)",
				padding: "24px",
				display: "flex",
				justifyContent: "center",
			})}
		>
			<ToasterContainer placement={PLACEMENT.bottomRight} />

			<div
				className={css({
					maxWidth: "640px",
					width: "100%",
					backgroundColor: "var(--color-bg-secondary)",
					border: "1px solid var(--color-bg-quaternary)",
					borderRadius: "14px",
					padding: "24px",
				})}
			>
				<h1
					className={css({
						fontSize: "24px",
						fontWeight: 700,
						color: "var(--color-text-primary)",
						marginBottom: "18px",
					})}
				>
					{t("appointments.detailsTitle")}
				</h1>

				<div
					className={css({ display: "grid", gap: "8px", marginBottom: "16px" })}
				>
					<div className={css({ color: "var(--color-text-primary)" })}>
						<strong>{t("dashboard.calendar.name")}:</strong> {appointment.name}
					</div>
					<div className={css({ color: "var(--color-text-secondary)" })}>
						<strong>{t("dashboard.calendar.email")}:</strong>{" "}
						{appointment.email || t("appointments.noEmail")}
					</div>
					<div className={css({ color: "var(--color-text-secondary)" })}>
						<strong>{t("dashboard.calendar.timeLabel")}:</strong>{" "}
						{new Date(appointment.start_at).toLocaleString(locale)} -{" "}
						{new Date(appointment.end_at).toLocaleString(locale)}
					</div>
					{appointment.meeting_place && (
						<div className={css({ color: "var(--color-text-secondary)" })}>
							<strong>{t("appointments.meetingPlace")}:</strong>{" "}
							{appointment.meeting_place}
						</div>
					)}
					{appointment.note && (
						<div className={css({ color: "var(--color-text-tertiary)" })}>
							<strong>{t("appointments.note")}:</strong> {appointment.note}
						</div>
					)}
				</div>

				<div
					className={css({
						backgroundColor: "var(--color-bg-tertiary)",
						border: "1px solid var(--color-bg-quaternary)",
						borderRadius: "8px",
						padding: "12px",
						marginBottom: "16px",
					})}
				>
					<div
						className={css({
							fontSize: "13px",
							color: "var(--color-text-secondary)",
							marginBottom: "6px",
						})}
					>
						{t("appointments.publicLink")}
					</div>
					<div
						className={css({
							display: "flex",
							gap: "8px",
							alignItems: "center",
						})}
					>
						<code
							className={css({
								flex: 1,
								color: "var(--color-accent-800)",
								wordBreak: "break-all",
							})}
						>
							{appointmentLink}
						</code>
						<Button
							kind={KIND.secondary}
							size={SIZE.mini}
							onClick={handleCopyLink}
						>
							<Copy size={14} />
						</Button>
					</div>
				</div>

				{isCanceled ? (
					<div
						className={css({
							padding: "12px",
							borderRadius: "8px",
							backgroundColor:
								"color-mix(in srgb, var(--color-error-bg) 13%, transparent)",
							border: "1px solid var(--color-error)",
							color: "var(--color-error-text)",
							fontWeight: 600,
						})}
					>
						{t("appointments.alreadyCanceled")}
					</div>
				) : (
					<Button
						onClick={handleCancel}
						isLoading={canceling}
						overrides={{ BaseButton: { style: { width: "100%" } } }}
					>
						{t("appointments.cancelBtn")}
					</Button>
				)}
			</div>
		</div>
	);
}
