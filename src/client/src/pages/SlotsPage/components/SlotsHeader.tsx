import { useStyletron } from "baseui";
import { Button } from "baseui/button";

interface Props {
	onAddClick: () => void;
	t: (key: string) => string;
}

export default function SlotsHeader({ onAddClick, t }: Props) {
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
				{t("slots.title")}
			</h1>
			<Button onClick={onAddClick}>{t("slots.addSlot")}</Button>
		</div>
	);
}
