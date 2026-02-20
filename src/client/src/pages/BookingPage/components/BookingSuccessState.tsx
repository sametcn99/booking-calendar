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
				backgroundColor: "#0a0a0a",
				textAlign: "center",
				padding: "24px",
			})}
		>
			<div
				className={css({
					backgroundColor: "#141414",
					borderRadius: "12px",
					padding: "48px",
					border: "1px solid #2a2a2a",
					maxWidth: "480px",
				})}
			>
				<div
					className={css({
						width: "64px",
						height: "64px",
						borderRadius: "50%",
						backgroundColor: "#1a3525",
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
						color: "#a7f3d0",
						marginBottom: "12px",
					})}
				>
					{title}
				</h1>
				<p className={css({ color: "#b8a9d4", fontSize: "14px" })}>{message}</p>
			</div>
		</div>
	);
}
