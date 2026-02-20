import { useStyletron } from "baseui";

interface Props {
	title: string;
}

export default function LoginHeader({ title }: Props) {
	const [css] = useStyletron();

	return (
		<h1
			className={css({
				fontSize: "24px",
				fontWeight: 700,
				color: "var(--color-accent-800)",
				textAlign: "center",
				marginBottom: "32px",
			})}
		>
			{title}
		</h1>
	);
}
