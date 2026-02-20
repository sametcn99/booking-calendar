import { useStyletron } from "baseui";
import type { ApiCommunityEvent } from "../../../api";

const statusColor: Record<string, string> = {
	pending: "var(--color-warning)",
	active: "var(--color-success)",
	canceled: "var(--color-error)",
};

interface Props {
	event: ApiCommunityEvent;
	t: (key: string) => string;
}

export default function CommunityEventInfoCard({ event, t }: Props) {
	const [css] = useStyletron();

	const statusLabel: Record<string, string> = {
		pending: t("communityEvents.statusPending"),
		active: t("communityEvents.statusActive"),
		canceled: t("communityEvents.statusCanceled"),
	};

	return (
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
				{new Date(event.start_at).toLocaleString()} -{" "}
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
	);
}
