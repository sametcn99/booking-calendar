import { useStyletron } from "baseui";

interface Props {
	title: string;
}

export default function AppointmentsHeader({ title }: Props) {
	const [css] = useStyletron();

	return (
		<h1
			className={css({
				fontSize: "28px",
				fontWeight: 700,
				color: "#e0d6f0",
				marginBottom: "24px",
			})}
		>
			{title}
		</h1>
	);
}
