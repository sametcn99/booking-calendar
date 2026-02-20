import { useStyletron } from "baseui";
import { Checkbox, STYLE_TYPE } from "baseui/checkbox";

interface Props {
	enabled: boolean;
	onToggle: (enabled: boolean) => void;
	saving: boolean;
	t: (key: string) => string;
	titleKey: string;
	descriptionKey: string;
	enabledKey: string;
	disabledKey: string;
	surface?: "card" | "list";
}

export default function NotificationSettingSection({
	enabled,
	onToggle,
	saving,
	t,
	titleKey,
	descriptionKey,
	enabledKey,
	disabledKey,
	surface = "card",
}: Props) {
	const [css] = useStyletron();
	const isList = surface === "list";

	return (
		<div
			className={css({
				backgroundColor: "var(--color-bg-secondary)",
				borderRadius: isList ? "10px" : "12px",
				padding: isList ? "18px" : "24px",
				border: "1px solid var(--color-bg-quaternary)",
			})}
		>
			<h2
				className={css({
					fontSize: "18px",
					fontWeight: 700,
					color: "var(--color-text-primary)",
					marginBottom: "12px",
				})}
			>
				{t(titleKey)}
			</h2>
			<div
				className={css({
					fontSize: "13px",
					color: "var(--color-text-secondary)",
					marginBottom: "14px",
				})}
			>
				{t(descriptionKey)}
			</div>

			<Checkbox
				checked={enabled}
				onChange={(e) => onToggle(e.currentTarget.checked)}
				checkmarkType={STYLE_TYPE.toggle_round}
				disabled={saving}
			>
				{enabled ? t(enabledKey) : t(disabledKey)}
			</Checkbox>
		</div>
	);
}
