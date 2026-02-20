import { useStyletron } from "baseui";
import { Button, SIZE } from "baseui/button";
import { Input } from "baseui/input";
import { toaster } from "baseui/toast";
import { Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { type ApiCommunityEvent, api } from "../../api";
import { useI18n } from "../../context/I18nContext";

const normalizeApproverName = (value: string) =>
	value.trim().replace(/\s+/g, " ").toLowerCase();

export default function CommunityEventApprovalPage() {
	const [css] = useStyletron();
	const { slugId } = useParams<{ slugId: string }>();
	const { t } = useI18n();
	const [event, setEvent] = useState<ApiCommunityEvent | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [approving, setApproving] = useState(false);
	const [approved, setApproved] = useState(false);
	const [approverName, setApproverName] = useState("");
	const [alreadyApprovedLocal, setAlreadyApprovedLocal] = useState(false);

	const getStorageKey = useCallback(
		() => (slugId ? `community_event_approved_${slugId}` : ""),
		[slugId],
	);

	const getStoredApprovers = useCallback((): string[] => {
		const key = getStorageKey();
		if (!key) return [];
		try {
			const parsed = JSON.parse(localStorage.getItem(key) || "[]");
			if (!Array.isArray(parsed)) return [];
			return parsed.filter(
				(value): value is string => typeof value === "string",
			);
		} catch {
			return [];
		}
	}, [getStorageKey]);

	const fetchEvent = useCallback(() => {
		if (!slugId) return;
		api
			.getPublicCommunityEvent(slugId)
			.then((r) => setEvent(r.data))
			.catch(() => setError(t("common.error")));
	}, [slugId, t]);

	useEffect(() => {
		fetchEvent();
	}, [fetchEvent]);

	useEffect(() => {
		const stored = getStoredApprovers();
		if (approverName && stored.includes(normalizeApproverName(approverName))) {
			setAlreadyApprovedLocal(true);
			return;
		}
		setAlreadyApprovedLocal(false);
	}, [approverName, getStoredApprovers]);

	const handleApprove = async () => {
		if (!slugId) return;
		const normalizedName = normalizeApproverName(approverName);
		if (normalizedName.length < 3 || !normalizedName.includes(" ")) {
			toaster.negative(t("communityEvents.fullNameInvalid"), {});
			return;
		}

		const approvalId = normalizedName;
		if (getStoredApprovers().includes(approvalId)) {
			setAlreadyApprovedLocal(true);
			toaster.negative(t("communityEvents.alreadyApprovedLocal"), {});
			return;
		}

		setApproving(true);
		try {
			const r = await api.approveCommunityEvent(slugId, {
				full_name: approverName.trim().replace(/\s+/g, " "),
			});
			setEvent(r.data);
			setApproved(true);
			const key = getStorageKey();
			const stored = getStoredApprovers();
			if (key && !stored.includes(approvalId)) {
				localStorage.setItem(key, JSON.stringify([...stored, approvalId]));
			}
			setAlreadyApprovedLocal(true);
			setApproverName("");
		} catch (e) {
			toaster.negative(e instanceof Error ? e.message : t("common.error"), {});
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
					backgroundColor: "var(--color-bg-primary)",
					color: "var(--color-text-muted)",
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
					backgroundColor: "var(--color-bg-primary)",
					color: "var(--color-text-muted)",
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
		pending: "var(--color-warning)",
		active: "var(--color-success)",
		canceled: "var(--color-error)",
	};

	const statusLabel: Record<string, string> = {
		pending: t("communityEvents.statusPending"),
		active: t("communityEvents.statusActive"),
		canceled: t("communityEvents.statusCanceled"),
	};

	const shareLink = slugId
		? `${window.location.origin}/community/${slugId}`
		: "";

	const handleCopyLink = async () => {
		if (!shareLink) return;
		await navigator.clipboard.writeText(shareLink);
		toaster.positive(t("communityEvents.copied"), {});
	};

	return (
		<div
			className={css({
				minHeight: "100vh",
				backgroundColor: "var(--color-bg-primary)",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				padding: "24px",
			})}
		>
			<div
				className={css({
					backgroundColor: "var(--color-bg-secondary)",
					borderRadius: "16px",
					padding: "32px",
					border: "1px solid var(--color-bg-quaternary)",
					maxWidth: "480px",
					width: "100%",
				})}
			>
				<h1
					className={css({
						fontSize: "24px",
						fontWeight: 700,
						color: "var(--color-text-primary)",
						marginBottom: "24px",
						textAlign: "center",
					})}
				>
					{t("communityEvents.approveTitle")}
				</h1>

				<div
					className={css({
						backgroundColor: "var(--color-bg-tertiary)",
						borderRadius: "10px",
						padding: "20px",
						border: "1px solid var(--color-bg-quaternary)",
						marginBottom: "20px",
					})}
				>
					<div
						className={css({
							fontSize: "14px",
							fontWeight: 600,
							color: "var(--color-text-secondary)",
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
								color: "var(--color-text-primary)",
							})}
						>
							{event.title}
						</span>
					</div>

					{event.description && (
						<div
							className={css({
								fontSize: "13px",
								color: "var(--color-text-secondary)",
								marginBottom: "8px",
							})}
						>
							{event.description}
						</div>
					)}

					<div
						className={css({
							fontSize: "13px",
							color: "var(--color-text-muted)",
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
							color: "var(--color-text-on-primary)",
							backgroundColor:
								statusColor[event.status] ?? "var(--color-text-on-muted)",
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
						<span
							className={css({
								fontSize: "13px",
								color: "var(--color-text-secondary)",
							})}
						>
							{t("communityEvents.approvalProgress")}
						</span>
						<span
							className={css({
								fontSize: "13px",
								color: "var(--color-text-primary)",
								fontWeight: 600,
							})}
						>
							{event.current_approvals}/{event.required_approvals}
						</span>
					</div>
					<div
						className={css({
							height: "8px",
							backgroundColor: "var(--color-bg-quaternary)",
							borderRadius: "4px",
							overflow: "hidden",
						})}
					>
						<div
							className={css({
								height: "100%",
								width: `${progress}%`,
								backgroundColor:
									event.status === "active"
										? "var(--color-success)"
										: "var(--color-accent-800)",
								borderRadius: "4px",
								transition: "width 0.3s ease",
							})}
						/>
					</div>
				</div>

				<div className={css({ marginBottom: "16px" })}>
					<div
						className={css({
							fontSize: "13px",
							color: "var(--color-text-secondary)",
							marginBottom: "6px",
						})}
					>
						{t("communityEvents.approverFullName")}
					</div>
					<Input
						value={approverName}
						onChange={(e) => setApproverName(e.currentTarget.value)}
						placeholder={t("communityEvents.approverFullNamePlaceholder")}
						type="text"
						size={SIZE.compact}
					/>
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
								color: "var(--color-accent-800)",
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
							backgroundColor:
								"color-mix(in srgb, var(--color-success) 13%, transparent)",
							border: "1px solid var(--color-success)",
							borderRadius: "8px",
							padding: "12px",
							textAlign: "center",
							color: "var(--color-success-light)",
							fontSize: "14px",
							fontWeight: 600,
							marginBottom: "16px",
						})}
					>
						{t("communityEvents.approved")}
					</div>
				)}

				{event.status === "pending" && !approved && !alreadyApprovedLocal && (
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

				{event.status === "pending" && alreadyApprovedLocal && !approved && (
					<div
						className={css({
							backgroundColor:
								"color-mix(in srgb, var(--color-warning) 13%, transparent)",
							border: "1px solid var(--color-warning)",
							borderRadius: "8px",
							padding: "12px",
							textAlign: "center",
							color: "var(--color-warning-light)",
							fontSize: "14px",
							fontWeight: 600,
						})}
					>
						{t("communityEvents.alreadyApprovedLocal")}
					</div>
				)}
			</div>
		</div>
	);
}
