import { useStyletron } from "baseui";

interface Props {
	title: string;
	description: string;
}

export default function DashboardHeader({ title, description }: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				marginBottom: "28px",
			})}
		>
			<h1
				className={css({
					fontSize: "28px",
					fontWeight: 700,
					color: "var(--color-text-primary)",
					marginTop: 0,
					marginBottom: "8px",
				})}
			>
				{title}
			</h1>
			<p
				className={css({
					fontSize: "14px",
					lineHeight: 1.5,
					color: "var(--color-text-subtle)",
					margin: 0,
					maxWidth: "760px",
				})}
			>
				{description}
			</p>
		</div>
	);
}
