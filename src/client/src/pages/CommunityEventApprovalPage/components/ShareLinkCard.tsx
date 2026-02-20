import { useStyletron } from "baseui";
import { Button, SIZE } from "baseui/button";
import { Copy } from "lucide-react";

interface Props {
	onCopy: () => void;
	shareLink: string;
	t: (key: string) => string;
}

export default function ShareLinkCard({ onCopy, shareLink, t }: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				backgroundColor: "var(--color-bg-tertiary)",
				border: "1px solid var(--color-bg-quaternary)",
				borderRadius: "8px",
				padding: "12px",
				marginBottom: "16px",
			})}
		>
			<div
				className={css({
					fontSize: "13px",
					color: "var(--color-text-secondary)",
					marginBottom: "6px",
				})}
			>
				{t("communityEvents.shareLink")}
			</div>
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "8px",
				})}
			>
				<code
					className={css({
						flex: 1,
						fontSize: "12px",
						color: "var(--color-accent-800)",
						wordBreak: "break-all",
					})}
				>
					{shareLink}
				</code>
				<Button size={SIZE.mini} onClick={onCopy}>
					<Copy size={12} />
				</Button>
			</div>
		</div>
	);
}
