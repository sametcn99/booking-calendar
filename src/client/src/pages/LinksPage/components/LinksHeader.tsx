import { useStyletron } from "baseui";
import { Button } from "baseui/button";

interface Props {
	onCreateClick: () => void;
	t: (key: string) => string;
}

export default function LinksHeader({ onCreateClick, t }: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				display: "flex",
				justifyContent: "space-between",
				alignItems: "flex-start",
				marginBottom: "24px",
				gap: "16px",
			})}
		>
			<div>
				<h1
					className={css({
						fontSize: "28px",
						fontWeight: 700,
						color: "var(--color-text-primary)",
						marginTop: 0,
						marginBottom: "8px",
					})}
				>
					{t("links.title")}
				</h1>
				<p
					className={css({
						fontSize: "14px",
						lineHeight: 1.5,
						color: "var(--color-text-subtle)",
						margin: 0,
						maxWidth: "760px",
					})}
				>
					{t("links.description")}
				</p>
			</div>
			<Button onClick={onCreateClick}>{t("links.create")}</Button>
		</div>
	);
}
