import { useStyletron } from "baseui";
import { Button, SIZE } from "baseui/button";
import { toaster } from "baseui/toast";
import { Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type ApiCommunityEvent, api } from "../../api";
import { useI18n } from "../../context/I18nContext";

export default function CommunityEventApprovalPage() {
	const [css] = useStyletron();
	const { token } = useParams<{ token: string }>();
	const { t } = useI18n();
	const [event, setEvent] = useState<ApiCommunityEvent | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [approving, setApproving] = useState(false);
	const [approved, setApproved] = useState(false);

	const fetchEvent = useCallback(() => {
		if (!token) return;
		api
			.getPublicCommunityEvent(token)
			.then((r) => setEvent(r.data))
			.catch(() => setError("Event not found"));
	}, [token]);

	useEffect(() => {
		fetchEvent();
	}, [fetchEvent]);

	const handleApprove = async () => {
		if (!token) return;
		setApproving(true);
		try {
			const r = await api.approveCommunityEvent(token);
			setEvent(r.data);
			setApproved(true);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error");
		} finally {
			setApproving(false);
		}
	};

	if (error) {
		return (
			<div
				className={css({
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
					backgroundColor: "#0a0a0a",
					color: "#888",
					fontSize: "18px",
				})}
			>
				{error}
			</div>
		);
	}

	if (!event) {
		return (
			<div
				className={css({
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
					backgroundColor: "#0a0a0a",
					color: "#888",
					fontSize: "18px",
				})}
			>
				Loading...
			</div>
		);
	}

	const progress = Math.min(
		(event.current_approvals / event.required_approvals) * 100,
		100,
	);

	const statusColor: Record<string, string> = {
		pending: "#f59e0b",
		active: "#22c55e",
		canceled: "#ef4444",
	};

	const statusLabel: Record<string, string> = {
		pending: t("communityEvents.statusPending"),
		active: t("communityEvents.statusActive"),
		canceled: t("communityEvents.statusCanceled"),
	};

	const shareLink = token ? `${window.location.origin}/community/${token}` : "";

	const handleCopyLink = async () => {
		if (!shareLink) return;
		await navigator.clipboard.writeText(shareLink);
		toaster.positive(t("communityEvents.copied"), {});
	};

	return (
		<div
			className={css({
				minHeight: "100vh",
				backgroundColor: "#0a0a0a",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				padding: "24px",
			})}
		>
			<div
				className={css({
					backgroundColor: "#141414",
					borderRadius: "16px",
					padding: "32px",
					border: "1px solid #2a2a2a",
					maxWidth: "480px",
					width: "100%",
				})}
			>
				<h1
					className={css({
						fontSize: "24px",
						fontWeight: 700,
						color: "#e0d6f0",
						marginBottom: "24px",
						textAlign: "center",
					})}
				>
					{t("communityEvents.approveTitle")}
				</h1>

				<div
					className={css({
						backgroundColor: "#1e1e1e",
						borderRadius: "10px",
						padding: "20px",
						border: "1px solid #2a2a2a",
						marginBottom: "20px",
					})}
				>
					<div
						className={css({
							fontSize: "14px",
							fontWeight: 600,
							color: "#b8a9d4",
							marginBottom: "12px",
						})}
					>
						{t("communityEvents.eventInfo")}
					</div>

					<div
						className={css({
							display: "flex",
							alignItems: "center",
							gap: "8px",
							marginBottom: "8px",
						})}
					>
						{event.color && (
							<span
								className={css({
									width: "12px",
									height: "12px",
									borderRadius: "50%",
									backgroundColor: event.color,
									display: "inline-block",
								})}
							/>
						)}
						<span
							className={css({
								fontSize: "18px",
								fontWeight: 700,
								color: "#e0d6f0",
							})}
						>
							{event.title}
						</span>
					</div>

					{event.description && (
						<div
							className={css({
								fontSize: "13px",
								color: "#b8a9d4",
								marginBottom: "8px",
							})}
						>
							{event.description}
						</div>
					)}

					<div
						className={css({
							fontSize: "13px",
							color: "#888",
							marginBottom: "8px",
						})}
					>
						{new Date(event.start_at).toLocaleString()} —{" "}
						{new Date(event.end_at).toLocaleString()}
					</div>

					<span
						className={css({
							fontSize: "12px",
							fontWeight: 600,
							padding: "3px 10px",
							borderRadius: "4px",
							color: "#fff",
							backgroundColor: statusColor[event.status] ?? "#666",
						})}
					>
						{statusLabel[event.status] ?? event.status}
					</span>
				</div>

				{/* Approval Progress */}
				<div className={css({ marginBottom: "20px" })}>
					<div
						className={css({
							display: "flex",
							justifyContent: "space-between",
							marginBottom: "6px",
						})}
					>
						<span className={css({ fontSize: "13px", color: "#b8a9d4" })}>
							{t("communityEvents.approvalProgress")}
						</span>
						<span
							className={css({
								fontSize: "13px",
								color: "#e0d6f0",
								fontWeight: 600,
							})}
						>
							{event.current_approvals}/{event.required_approvals}
						</span>
					</div>
					<div
						className={css({
							height: "8px",
							backgroundColor: "#2a2a2a",
							borderRadius: "4px",
							overflow: "hidden",
						})}
					>
						<div
							className={css({
								height: "100%",
								width: `${progress}%`,
								backgroundColor:
									event.status === "active" ? "#22c55e" : "#a78bfa",
								borderRadius: "4px",
								transition: "width 0.3s ease",
							})}
						/>
					</div>
				</div>

				<div
					className={css({
						backgroundColor: "#1e1e1e",
						border: "1px solid #2a2a2a",
						borderRadius: "8px",
						padding: "12px",
						marginBottom: "16px",
					})}
				>
					<div
						className={css({
							fontSize: "13px",
							color: "#b8a9d4",
							marginBottom: "6px",
						})}
					>
						{t("communityEvents.shareLink")}
					</div>
					<div
						className={css({
							display: "flex",
							alignItems: "center",
							gap: "8px",
						})}
					>
						<code
							className={css({
								flex: 1,
								fontSize: "12px",
								color: "#a78bfa",
								wordBreak: "break-all",
							})}
						>
							{shareLink}
						</code>
						<Button size={SIZE.mini} onClick={handleCopyLink}>
							<Copy size={12} />
						</Button>
					</div>
				</div>

				{approved && (
					<div
						className={css({
							backgroundColor: "#22c55e22",
							border: "1px solid #22c55e",
							borderRadius: "8px",
							padding: "12px",
							textAlign: "center",
							color: "#4ade80",
							fontSize: "14px",
							fontWeight: 600,
							marginBottom: "16px",
						})}
					>
						{t("communityEvents.approved")}
					</div>
				)}

				{event.status === "pending" && !approved && (
					<Button
						size={SIZE.large}
						onClick={handleApprove}
						isLoading={approving}
						overrides={{
							BaseButton: {
								style: { width: "100%" },
							},
						}}
					>
						{t("communityEvents.approveBtn")}
					</Button>
				)}
			</div>
		</div>
	);
}
