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
				alignItems: "center",
				marginBottom: "24px",
			})}
		>
			<h1
				className={css({
					fontSize: "28px",
					fontWeight: 700,
					color: "#e0d6f0",
				})}
			>
				{t("links.title")}
			</h1>
			<Button onClick={onCreateClick}>{t("links.create")}</Button>
		</div>
	);
}
