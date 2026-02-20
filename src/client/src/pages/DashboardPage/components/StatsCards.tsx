import { useStyletron } from "baseui";
import type { DashboardStatCard } from "../hooks/useDashboardPage";

interface Props {
	cards: DashboardStatCard[];
}

export default function StatsCards({ cards }: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				display: "grid",
				gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
				gap: "24px",
			})}
		>
			{cards.map((card) => (
				<div
					key={card.label}
					className={css({
						backgroundColor: "var(--color-bg-secondary)",
						borderRadius: "12px",
						padding: "24px",
						border: "1px solid var(--color-bg-quaternary)",
					})}
				>
					<div
						className={css({
							fontSize: "14px",
							color: "var(--color-text-secondary)",
							marginBottom: "8px",
						})}
					>
						{card.label}
					</div>
					<div
						className={css({
							fontSize: "36px",
							fontWeight: 700,
							color: card.color,
						})}
					>
						{card.value}
					</div>
				</div>
			))}
		</div>
	);
}
