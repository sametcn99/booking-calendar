import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Input } from "baseui/input";
import { Textarea } from "baseui/textarea";
import { toaster } from "baseui/toast";
import { Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type ApiCommunityEvent, api } from "../../../api";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import { APP_COLORS } from "../../../theme";

interface Props {
	t: (key: string) => string;
}

const STATUS_COLORS: Record<string, string> = {
	pending: "var(--color-warning)",
	active: "var(--color-success)",
	canceled: "var(--color-error)",
};

export default function CommunityEventsSection({ t }: Props) {
	const [css] = useStyletron();
	const [events, setEvents] = useState<ApiCommunityEvent[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startAt, setStartAt] = useState("");
	const [endAt, setEndAt] = useState("");
	const [color, setColor] = useState<string>(APP_COLORS.accent800);
	const [requiredApprovals, setRequiredApprovals] = useState(3);
	const [creating, setCreating] = useState(false);
	const [confirmDeleteSlugId, setConfirmDeleteSlugId] = useState<string | null>(
		null,
	);

	const getShareLink = (slugId: string) =>
		`${window.location.origin}/community/${slugId}`;

	const fetchEvents = useCallback(() => {
		api
			.getCommunityEvents()
			.then((r) => setEvents(r.data))
			.catch(() => {});
	}, []);

	useEffect(() => {
		fetchEvents();
	}, [fetchEvents]);

	const handleCreate = async () => {
		if (!title || !startAt || !endAt) {
			toaster.negative(t("communityEvents.fieldsRequired"), {});
			return;
		}
		setCreating(true);
		try {
			const created = await api.createCommunityEvent({
				title,
				description: description || undefined,
				start_at: startAt,
				end_at: endAt,
				color,
				required_approvals: requiredApprovals,
			});
			toaster.positive(t("communityEvents.created"), {});
			toaster.info(
				`${t("communityEvents.shareLink")}: ${getShareLink(created.data.slug_id)}`,
				{},
			);
			setTitle("");
			setDescription("");
			setStartAt("");
			setEndAt("");
			setColor(APP_COLORS.accent800);
			setRequiredApprovals(3);
			setShowForm(false);
			fetchEvents();
		} catch (e) {
			toaster.negative(e instanceof Error ? e.message : t("common.error"), {});
		} finally {
			setCreating(false);
		}
	};

	const handleDelete = async (slugId: string) => {
		try {
			await api.deleteCommunityEvent(slugId);
			toaster.positive(t("communityEvents.deleted"), {});
			fetchEvents();
		} catch (e) {
			toaster.negative(e instanceof Error ? e.message : t("common.error"), {});
		}
	};

	const handleConfirmDelete = async () => {
		if (!confirmDeleteSlugId) return;
		await handleDelete(confirmDeleteSlugId);
		setConfirmDeleteSlugId(null);
	};

	const handleCopyLink = async (slugId: string) => {
		const link = getShareLink(slugId);
		await navigator.clipboard.writeText(link);
		toaster.positive(t("communityEvents.copied"), {});
	};

	const statusLabel = (status: string) => {
		const map: Record<string, string> = {
			pending: t("communityEvents.statusPending"),
			active: t("communityEvents.statusActive"),
			canceled: t("communityEvents.statusCanceled"),
		};
		return map[status] ?? status;
	};

	return (
		<div
			className={css({
				backgroundColor: "var(--color-bg-secondary)",
				borderRadius: "12px",
				padding: "24px",
				border: "1px solid var(--color-bg-quaternary)",
			})}
		>
			<div
				className={css({
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "16px",
				})}
			>
				<h2
					className={css({
						fontSize: "18px",
						fontWeight: 700,
						color: "var(--color-text-primary)",
						margin: 0,
					})}
				>
					{t("communityEvents.title")}
				</h2>
				<Button
					kind={KIND.secondary}
					size={SIZE.compact}
					onClick={() => setShowForm((p) => !p)}
				>
					<Plus size={14} />
					<span className={css({ marginLeft: "4px" })}>
						{t("communityEvents.create")}
					</span>
				</Button>
			</div>

			{showForm && (
				<div
					className={css({
						backgroundColor: "var(--color-bg-tertiary)",
						borderRadius: "8px",
						padding: "16px",
						border: "1px solid var(--color-bg-quaternary)",
						marginBottom: "16px",
						display: "flex",
						flexDirection: "column",
						gap: "10px",
					})}
				>
					<div>
						<div
							className={css({
								fontSize: "12px",
								color: "var(--color-text-secondary)",
								marginBottom: "4px",
							})}
						>
							{t("communityEvents.eventTitle")}
						</div>
						<Input
							value={title}
							onChange={(e) => setTitle(e.currentTarget.value)}
							placeholder={t("communityEvents.eventTitlePlaceholder")}
							size={SIZE.compact}
						/>
					</div>
					<div>
						<div
							className={css({
								fontSize: "12px",
								color: "var(--color-text-secondary)",
								marginBottom: "4px",
							})}
						>
							{t("communityEvents.description")}
						</div>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.currentTarget.value)}
							placeholder={t("communityEvents.descriptionPlaceholder")}
							size={SIZE.compact}
						/>
					</div>
					<div
						className={css({ display: "flex", gap: "10px", flexWrap: "wrap" })}
					>
						<div className={css({ flex: 1, minWidth: "140px" })}>
							<div
								className={css({
									fontSize: "12px",
									color: "var(--color-text-secondary)",
									marginBottom: "4px",
								})}
							>
								{t("communityEvents.startTime")}
							</div>
							<Input
								value={startAt}
								onChange={(e) => setStartAt(e.currentTarget.value)}
								type="datetime-local"
								size={SIZE.compact}
							/>
						</div>
						<div className={css({ flex: 1, minWidth: "140px" })}>
							<div
								className={css({
									fontSize: "12px",
									color: "var(--color-text-secondary)",
									marginBottom: "4px",
								})}
							>
								{t("communityEvents.endTime")}
							</div>
							<Input
								value={endAt}
								onChange={(e) => setEndAt(e.currentTarget.value)}
								type="datetime-local"
								size={SIZE.compact}
							/>
						</div>
					</div>
					<div
						className={css({ display: "flex", gap: "10px", flexWrap: "wrap" })}
					>
						<div className={css({ flex: 1, minWidth: "100px" })}>
							<div
								className={css({
									fontSize: "12px",
									color: "var(--color-text-secondary)",
									marginBottom: "4px",
								})}
							>
								{t("communityEvents.color")}
							</div>
							<input
								type="color"
								aria-label={t("communityEvents.color")}
								value={color}
								onChange={(e) => setColor(e.target.value)}
								className={css({
									width: "100%",
									height: "32px",
									border: "none",
									borderRadius: "6px",
									cursor: "pointer",
									backgroundColor: "transparent",
								})}
							/>
						</div>
						<div className={css({ flex: 1, minWidth: "100px" })}>
							<div
								className={css({
									fontSize: "12px",
									color: "var(--color-text-secondary)",
									marginBottom: "4px",
								})}
							>
								{t("communityEvents.requiredApprovals")}
							</div>
							<Input
								value={String(requiredApprovals)}
								onChange={(e) =>
									setRequiredApprovals(Number(e.currentTarget.value) || 1)
								}
								type="number"
								min={1}
								size={SIZE.compact}
							/>
						</div>
					</div>
					<div
						className={css({
							display: "flex",
							gap: "8px",
							justifyContent: "flex-end",
						})}
					>
						<Button
							kind={KIND.tertiary}
							size={SIZE.compact}
							onClick={() => setShowForm(false)}
						>
							{t("communityEvents.cancel")}
						</Button>
						<Button
							size={SIZE.compact}
							onClick={handleCreate}
							isLoading={creating}
						>
							{t("communityEvents.createBtn")}
						</Button>
					</div>
				</div>
			)}

			{events.length === 0 && !showForm && (
				<div
					className={css({
						fontSize: "13px",
						color: "var(--color-text-secondary)",
					})}
				>
					{t("communityEvents.empty")}
				</div>
			)}

			<div
				className={css({
					display: "flex",
					flexDirection: "column",
					gap: "10px",
				})}
			>
				{events.map((ev) => (
					<div
						key={ev.slug_id}
						className={css({
							backgroundColor: "var(--color-bg-tertiary)",
							borderRadius: "8px",
							padding: "14px",
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
									{ev.color && (
										<span
											className={css({
												width: "10px",
												height: "10px",
												borderRadius: "50%",
												backgroundColor: ev.color,
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
										{ev.title}
									</span>
									<span
										className={css({
											fontSize: "11px",
											fontWeight: 600,
											padding: "2px 8px",
											borderRadius: "4px",
											color: "var(--color-text-on-primary)",
											backgroundColor:
												STATUS_COLORS[ev.status] ??
												"var(--color-text-on-muted)",
										})}
									>
										{statusLabel(ev.status)}
									</span>
								</div>
								{ev.description && (
									<div
										className={css({
											fontSize: "12px",
											color: "var(--color-text-secondary)",
											marginBottom: "4px",
										})}
									>
										{ev.description}
									</div>
								)}
								<div
									className={css({
										fontSize: "12px",
										color: "var(--color-text-muted)",
									})}
								>
									{new Date(ev.start_at).toLocaleString()} —{" "}
									{new Date(ev.end_at).toLocaleString()}
								</div>
							</div>
							<Button
								kind={KIND.tertiary}
								size={SIZE.mini}
								onClick={() => setConfirmDeleteSlugId(ev.slug_id)}
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
								{t("communityEvents.approvals")}: {ev.current_approvals}/
								{ev.required_approvals}
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
									size={SIZE.mini}
									onClick={() =>
										window.open(getShareLink(ev.slug_id), "_blank")
									}
								>
									<ExternalLink size={12} />
									<span className={css({ marginLeft: "4px" })}>
										{t("communityEvents.openLink")}
									</span>
								</Button>
								<Button
									kind={KIND.secondary}
									size={SIZE.mini}
									onClick={() => handleCopyLink(ev.slug_id)}
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
								marginTop: "8px",
								padding: "8px 10px",
								backgroundColor: "var(--color-bg-secondary)",
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
								{getShareLink(ev.slug_id)}
							</code>
						</div>
					</div>
				))}
			</div>

			<ConfirmationDialog
				isOpen={Boolean(confirmDeleteSlugId)}
				title={t("common.confirmationTitle")}
				message={t("common.confirmDeleteMessage")}
				confirmLabel={t("common.confirm")}
				cancelLabel={t("common.cancel")}
				onConfirm={handleConfirmDelete}
				onClose={() => setConfirmDeleteSlugId(null)}
			/>
		</div>
	);
}
