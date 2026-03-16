import { useStyletron } from "baseui";

interface Props {
	title: string;
	description: string;
}

export default function SettingsPageHeader({ title, description }: Props) {
	const [css] = useStyletron();

	return (
		<>
			<h1
				className={css({
					fontSize: "30px",
					fontWeight: 700,
					color: "var(--color-text-primary)",
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
					marginBottom: "22px",
				})}
			>
				{description}
			</p>
		</>
	);
}
