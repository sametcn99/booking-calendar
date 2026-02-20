import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import type { ApiCommunityEvent } from "../../../api";
import { getApprovalRecords, STATUS_COLORS, statusLabel } from "./types";

interface Props {
	event: ApiCommunityEvent;
	getShareLink: (slugId: string) => string;
	onCopyLink: (slugId: string) => void;
	onDelete: (slugId: string) => void;
	t: (key: string) => string;
}

export default function CommunityEventCard({
	event,
	getShareLink,
	onCopyLink,
	onDelete,
	t,
}: Props) {
	const [css] = useStyletron();
	const approvalRecords = getApprovalRecords(event);

	return (
		<div
			className={css({
				backgroundColor: "var(--color-bg-secondary)",
				borderRadius: "8px",
				padding: "16px 20px",
				border: "1px solid var(--color-bg-quaternary)",
			})}
		>
			<div
				className={css({
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					marginBottom: "8px",
				})}
			>
				<div>
					<div
						className={css({
							display: "flex",
							alignItems: "center",
							gap: "8px",
							marginBottom: "4px",
						})}
					>
						{event.color && (
							<span
								className={css({
									width: "10px",
									height: "10px",
									borderRadius: "50%",
									backgroundColor: event.color,
									display: "inline-block",
								})}
							/>
						)}
						<span
							className={css({
								fontSize: "15px",
								fontWeight: 600,
								color: "var(--color-text-primary)",
							})}
						>
							{event.title}
						</span>
						<span
							className={css({
								fontSize: "11px",
								fontWeight: 600,
								padding: "2px 8px",
								borderRadius: "4px",
								color: "var(--color-text-on-primary)",
								backgroundColor:
									STATUS_COLORS[event.status] ?? "var(--color-text-on-muted)",
							})}
						>
							{statusLabel(t, event.status)}
						</span>
					</div>
					{event.description && (
						<div
							className={css({
								fontSize: "12px",
								color: "var(--color-text-secondary)",
								marginBottom: "4px",
							})}
						>
							{event.description}
						</div>
					)}
					<div
						className={css({
							fontSize: "12px",
							color: "var(--color-text-muted)",
						})}
					>
						{new Date(event.start_at).toLocaleString()} -{" "}
						{new Date(event.end_at).toLocaleString()}
					</div>
				</div>
				<Button
					kind={KIND.tertiary}
					size={SIZE.compact}
					onClick={() => onDelete(event.slug_id)}
				>
					<Trash2 size={14} />
				</Button>
			</div>

			<div
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					flexWrap: "wrap",
					gap: "8px",
				})}
			>
				<div
					className={css({
						fontSize: "13px",
						color: "var(--color-text-secondary)",
					})}
				>
					{t("communityEvents.approvals")}: {event.current_approvals}/
					{event.required_approvals}
				</div>
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "8px",
					})}
				>
					<Button
						kind={KIND.secondary}
						size={SIZE.compact}
						onClick={() => window.open(getShareLink(event.slug_id), "_blank")}
					>
						<ExternalLink size={12} />
						<span className={css({ marginLeft: "4px" })}>
							{t("communityEvents.openLink")}
						</span>
					</Button>
					<Button
						kind={KIND.secondary}
						size={SIZE.compact}
						onClick={() => onCopyLink(event.slug_id)}
					>
						<Copy size={12} />
						<span className={css({ marginLeft: "4px" })}>
							{t("communityEvents.copyLink")}
						</span>
					</Button>
				</div>
			</div>

			<div
				className={css({
					marginTop: "10px",
					padding: "8px 10px",
					backgroundColor: "var(--color-bg-tertiary)",
					borderRadius: "6px",
					border: "1px solid var(--color-bg-quaternary)",
				})}
			>
				<div
					className={css({
						fontSize: "12px",
						color: "var(--color-text-tertiary)",
						marginBottom: "4px",
					})}
				>
					{t("communityEvents.shareLink")}
				</div>
				<code
					className={css({
						fontSize: "12px",
						color: "var(--color-accent-800)",
						wordBreak: "break-all",
					})}
				>
					{getShareLink(event.slug_id)}
				</code>
			</div>

			<div
				className={css({
					marginTop: "10px",
					padding: "8px 10px",
					backgroundColor: "var(--color-bg-tertiary)",
					borderRadius: "6px",
					border: "1px solid var(--color-bg-quaternary)",
				})}
			>
				<div
					className={css({
						fontSize: "12px",
						color: "var(--color-text-tertiary)",
						marginBottom: "6px",
					})}
				>
					{t("communityEvents.approversDetail")}
				</div>

				{approvalRecords.length === 0 && (
					<div
						className={css({
							fontSize: "12px",
							color: "var(--color-text-muted)",
						})}
					>
						{t("communityEvents.noApproversYet")}
					</div>
				)}

				{approvalRecords.length > 0 && (
					<div
						className={css({
							display: "flex",
							flexDirection: "column",
							gap: "6px",
						})}
					>
						{approvalRecords.map((record, index) => (
							<div
								key={`${event.slug_id}-${record.full_name}-${record.approved_at}-${index}`}
								className={css({
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									gap: "8px",
									flexWrap: "wrap",
									fontSize: "12px",
									color: "var(--color-text-secondary)",
								})}
							>
								<div>
									<strong>{record.full_name}</strong>
									{record.email ? ` (${record.email})` : ""}
								</div>
								<div className={css({ color: "var(--color-text-muted)" })}>
									{new Date(record.approved_at).toLocaleString()}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
