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
}: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				backgroundColor: "#141414",
				borderRadius: "12px",
				padding: "24px",
				border: "1px solid #2a2a2a",
			})}
		>
			<h2
				className={css({
					fontSize: "18px",
					fontWeight: 700,
					color: "#e0d6f0",
					marginBottom: "12px",
				})}
			>
				{t(titleKey)}
			</h2>
			<div
				className={css({
					fontSize: "13px",
					color: "#b8a9d4",
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
