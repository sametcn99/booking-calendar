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
				backgroundColor: "#0a0a0a",
				textAlign: "center",
				padding: "24px",
			})}
		>
			<div>
				<h1
					className={css({
						fontSize: "24px",
						color: "#fca5a5",
						marginBottom: "12px",
					})}
				>
					{title}
				</h1>
				<p className={css({ color: "#8b7aab" })}>{message}</p>
			</div>
		</div>
	);
}
