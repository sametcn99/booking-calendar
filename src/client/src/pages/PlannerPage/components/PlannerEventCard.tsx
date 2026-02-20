import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Edit2, Trash2 } from "lucide-react";
import type { ApiPlannerEvent } from "../../../api";

interface Props {
	event: ApiPlannerEvent;
	formatDate: (d: string) => string;
	onEdit: (event: ApiPlannerEvent) => void;
	onDelete: (id: number) => void;
}

export default function PlannerEventCard({
	event,
	formatDate,
	onEdit,
	onDelete,
}: Props) {
	const [css, theme] = useStyletron();

	return (
		<div
			className={css({
				backgroundColor: "#141414",
				borderRadius: "12px",
				padding: "16px 20px",
				border: "1px solid #2a2a2a",
				borderLeft: `4px solid ${event.color || "#f59e0b"}`,
				display: "flex",
				justifyContent: "space-between",
				alignItems: "flex-start",
				gap: "16px",
				boxShadow: theme.lighting.shadow400,
			})}
		>
			<div className={css({ flex: 1, minWidth: 0 })}>
				<h3
					className={css({
						...theme.typography.LabelLarge,
						color: theme.colors.contentPrimary,
						marginTop: 0,
						marginBottom: "4px",
					})}
				>
					{event.title}
				</h3>
				{event.description && (
					<p
						className={css({
							...theme.typography.ParagraphSmall,
							color: theme.colors.contentSecondary,
							marginTop: 0,
							marginBottom: "8px",
						})}
					>
						{event.description}
					</p>
				)}
				<p
					className={css({
						...theme.typography.ParagraphXSmall,
						color: theme.colors.contentTertiary,
						marginTop: 0,
						marginBottom: 0,
					})}
				>
					{formatDate(event.start_at)} – {formatDate(event.end_at)}
				</p>
			</div>
			<div className={css({ display: "flex", gap: "4px", flexShrink: 0 })}>
				<Button
					kind={KIND.tertiary}
					size={SIZE.compact}
					onClick={() => onEdit(event)}
					overrides={{
						BaseButton: {
							style: { color: theme.colors.contentSecondary },
						},
					}}
				>
					<Edit2 size={16} />
				</Button>
				<Button
					kind={KIND.tertiary}
					size={SIZE.compact}
					onClick={() => onDelete(event.id)}
					overrides={{
						BaseButton: {
							style: { color: theme.colors.contentNegative },
						},
					}}
				>
					<Trash2 size={16} />
				</Button>
			</div>
		</div>
	);
}
