import { useStyletron } from "baseui";

interface Props {
	subtitle: string;
	title: string;
}

export default function BookingHeader({ subtitle, title }: Props) {
	const [css] = useStyletron();

	return (
		<>
			<h1
				className={css({
					fontSize: "28px",
					fontWeight: 700,
					color: "var(--color-accent-800)",
					textAlign: "center",
					marginBottom: "8px",
				})}
			>
				{title}
			</h1>
			<p
				className={css({
					textAlign: "center",
					color: "var(--color-text-tertiary)",
					marginBottom: "32px",
				})}
			>
				{subtitle}
			</p>
		</>
	);
}
