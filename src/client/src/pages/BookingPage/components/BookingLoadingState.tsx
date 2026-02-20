import { useStyletron } from "baseui";

interface Props {
	message: string;
}

export default function BookingLoadingState({ message }: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "100vh",
				backgroundColor: "#0a0a0a",
				color: "#b8a9d4",
				fontSize: "18px",
			})}
		>
			{message}
		</div>
	);
}
