import { useStyletron } from "baseui";

interface Props {
	message: string;
	title: string;
}

export default function BookingInvalidState({ message, title }: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "100vh",
				backgroundColor: "var(--color-bg-primary)",
				textAlign: "center",
				padding: "24px",
			})}
		>
			<div>
				<h1
					className={css({
						fontSize: "24px",
						color: "var(--color-error-text)",
						marginBottom: "12px",
					})}
				>
					{title}
				</h1>
				<p className={css({ color: "var(--color-text-tertiary)" })}>
					{message}
				</p>
			</div>
		</div>
	);
}
