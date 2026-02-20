import { useStyletron } from "baseui";

interface Props {
	current: number;
	progress: number;
	required: number;
	status: string;
	t: (key: string) => string;
}

export default function ApprovalProgressBar({
	current,
	progress,
	required,
	status,
	t,
}: Props) {
	const [css] = useStyletron();

	return (
		<div className={css({ marginBottom: "20px" })}>
			<div
				className={css({
					display: "flex",
					justifyContent: "space-between",
					marginBottom: "6px",
				})}
			>
				<span
					className={css({
						fontSize: "13px",
						color: "var(--color-text-secondary)",
					})}
				>
					{t("communityEvents.approvalProgress")}
				</span>
				<span
					className={css({
						fontSize: "13px",
						color: "var(--color-text-primary)",
						fontWeight: 600,
					})}
				>
					{current}/{required}
				</span>
			</div>
			<div
				className={css({
					height: "8px",
					backgroundColor: "var(--color-bg-quaternary)",
					borderRadius: "4px",
					overflow: "hidden",
				})}
			>
				<div
					className={css({
						height: "100%",
						width: `${progress}%`,
						backgroundColor:
							status === "active"
								? "var(--color-success)"
								: "var(--color-accent-800)",
						borderRadius: "4px",
						transition: "width 0.3s ease",
					})}
				/>
			</div>
		</div>
	);
}
