import { useStyletron } from "baseui";

interface Props {
	message: string;
}

export default function ErrorBanner({ message }: Props) {
	const [css] = useStyletron();

	if (!message) return null;

	return (
		<div
			className={css({
				backgroundColor: "var(--color-error-bg)",
				color: "var(--color-error-text)",
				padding: "12px",
				borderRadius: "8px",
				marginBottom: "16px",
				fontSize: "14px",
			})}
		>
			{message}
		</div>
	);
}
