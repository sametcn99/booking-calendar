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
					color: "#a78bfa",
					textAlign: "center",
					marginBottom: "8px",
				})}
			>
				{title}
			</h1>
			<p
				className={css({
					textAlign: "center",
					color: "#8b7aab",
					marginBottom: "32px",
				})}
			>
				{subtitle}
			</p>
		</>
	);
}
