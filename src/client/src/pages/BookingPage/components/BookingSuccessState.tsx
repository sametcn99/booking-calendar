import { useStyletron } from "baseui";

interface Props {
	message: string;
	title: string;
}

export default function BookingSuccessState({ message, title }: Props) {
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
			<div
				className={css({
					backgroundColor: "var(--color-bg-secondary)",
					borderRadius: "12px",
					padding: "48px",
					border: "1px solid var(--color-bg-quaternary)",
					maxWidth: "480px",
				})}
			>
				<div
					className={css({
						width: "64px",
						height: "64px",
						borderRadius: "50%",
						backgroundColor: "var(--color-success-bg)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						margin: "0 auto 24px",
						fontSize: "32px",
					})}
				>
					OK
				</div>
				<h1
					className={css({
						fontSize: "24px",
						color: "var(--color-success-text)",
						marginBottom: "12px",
					})}
				>
					{title}
				</h1>
				<p
					className={css({
						color: "var(--color-text-secondary)",
						fontSize: "14px",
					})}
				>
					{message}
				</p>
			</div>
		</div>
	);
}
