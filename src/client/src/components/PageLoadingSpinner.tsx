import { useStyletron } from "baseui";
import { Loader } from "lucide-react";

interface Props {
	label?: string;
}

export default function PageLoadingSpinner({ label }: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: "80px 24px",
				gap: "16px",
			})}
		>
			<Loader
				size={32}
				className={css({
					color: "var(--color-accent-500, #8b5cf6)",
					animationName: {
						from: { transform: "rotate(0deg)" },
						to: { transform: "rotate(360deg)" },
					} as unknown as string,
					animationDuration: "1s",
					animationTimingFunction: "linear",
					animationIterationCount: "infinite",
				})}
			/>
			{label && (
				<p
					className={css({
						fontSize: "14px",
						color: "var(--color-text-subtle)",
						margin: 0,
					})}
				>
					{label}
				</p>
			)}
		</div>
	);
}
