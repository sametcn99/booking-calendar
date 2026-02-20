import { useStyletron } from "baseui";

interface Props {
	type: "success" | "warning";
	message: string;
}

export default function ApprovalStateNotice({ message, type }: Props) {
	const [css] = useStyletron();

	const isSuccess = type === "success";
	return (
		<div
			className={css({
				backgroundColor: isSuccess
					? "color-mix(in srgb, var(--color-success) 13%, transparent)"
					: "color-mix(in srgb, var(--color-warning) 13%, transparent)",
				border: isSuccess
					? "1px solid var(--color-success)"
					: "1px solid var(--color-warning)",
				borderRadius: "8px",
				padding: "12px",
				textAlign: "center",
				color: isSuccess
					? "var(--color-success-light)"
					: "var(--color-warning-light)",
				fontSize: "14px",
				fontWeight: 600,
				marginBottom: "16px",
			})}
		>
			{message}
		</div>
	);
}
