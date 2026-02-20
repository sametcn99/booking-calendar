import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Input } from "baseui/input";
import { Textarea } from "baseui/textarea";
import { toaster } from "baseui/toast";
import { Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type ApiCommunityEvent, api } from "../../../api";

interface Props {
	t: (key: string) => string;
}

const STATUS_COLORS: Record<string, string> = {
	pending: "#f59e0b",
	active: "#22c55e",
	canceled: "#ef4444",
};

export default function CommunityEventsSection({ t }: Props) {
	const [css] = useStyletron();
	const [events, setEvents] = useState<ApiCommunityEvent[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startAt, setStartAt] = useState("");
	const [endAt, setEndAt] = useState("");
	const [color, setColor] = useState("#a78bfa");
	const [requiredApprovals, setRequiredApprovals] = useState(3);
	const [creating, setCreating] = useState(false);

	const getShareLink = (token: string) =>
		`${window.location.origin}/community/${token}`;

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
			setTitle("");
			setDescription("");
			setStartAt("");
			setEndAt("");
			setColor("#a78bfa");
			setRequiredApprovals(3);
			setShowForm(false);
			fetchEvents();
			window.location.assign(getShareLink(created.data.share_token));
		} catch (e) {
			toaster.negative(e instanceof Error ? e.message : t("common.error"), {});
		} finally {
			setCreating(false);
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await api.deleteCommunityEvent(id);
			toaster.positive(t("communityEvents.deleted"), {});
			fetchEvents();
		} catch (e) {
			toaster.negative(e instanceof Error ? e.message : t("common.error"), {});
		}
	};

	const handleCopyLink = async (token: string) => {
		const link = getShareLink(token);
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
				backgroundColor: "#141414",
				borderRadius: "12px",
				padding: "24px",
				border: "1px solid #2a2a2a",
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
						color: "#e0d6f0",
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
						backgroundColor: "#1e1e1e",
						borderRadius: "8px",
						padding: "16px",
						border: "1px solid #2a2a2a",
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
								color: "#b8a9d4",
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
								color: "#b8a9d4",
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
									color: "#b8a9d4",
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
									color: "#b8a9d4",
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
									color: "#b8a9d4",
									marginBottom: "4px",
								})}
							>
								{t("communityEvents.color")}
							</div>
							<input
								type="color"
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
									color: "#b8a9d4",
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
				<div className={css({ fontSize: "13px", color: "#b8a9d4" })}>
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
						key={ev.id}
						className={css({
							backgroundColor: "#1e1e1e",
							borderRadius: "8px",
							padding: "14px",
							border: "1px solid #2a2a2a",
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
											color: "#e0d6f0",
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
											color: "#fff",
											backgroundColor: STATUS_COLORS[ev.status] ?? "#666",
										})}
									>
										{statusLabel(ev.status)}
									</span>
								</div>
								{ev.description && (
									<div
										className={css({
											fontSize: "12px",
											color: "#b8a9d4",
											marginBottom: "4px",
										})}
									>
										{ev.description}
									</div>
								)}
								<div className={css({ fontSize: "12px", color: "#888" })}>
									{new Date(ev.start_at).toLocaleString()} —{" "}
									{new Date(ev.end_at).toLocaleString()}
								</div>
							</div>
							<Button
								kind={KIND.tertiary}
								size={SIZE.mini}
								onClick={() => handleDelete(ev.id)}
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
							<div className={css({ fontSize: "13px", color: "#b8a9d4" })}>
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
										window.open(getShareLink(ev.share_token), "_blank")
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
									onClick={() => handleCopyLink(ev.share_token)}
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
								backgroundColor: "#141414",
								borderRadius: "6px",
								border: "1px solid #2a2a2a",
							})}
						>
							<div
								className={css({
									fontSize: "12px",
									color: "#8b7aab",
									marginBottom: "4px",
								})}
							>
								{t("communityEvents.shareLink")}
							</div>
							<code
								className={css({
									fontSize: "12px",
									color: "#a78bfa",
									wordBreak: "break-all",
								})}
							>
								{getShareLink(ev.share_token)}
							</code>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
