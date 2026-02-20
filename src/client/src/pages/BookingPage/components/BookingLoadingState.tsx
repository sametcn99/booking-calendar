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
				backgroundColor: "var(--color-bg-primary)",
				color: "var(--color-text-secondary)",
				fontSize: "18px",
			})}
		>
			{message}
		</div>
	);
}
