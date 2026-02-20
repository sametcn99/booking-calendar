import { useStyletron } from "baseui";
import { Checkbox, STYLE_TYPE } from "baseui/checkbox";

interface Props {
	enabled: boolean;
	onToggle: (enabled: boolean) => void;
	saving: boolean;
	disabled?: boolean;
	t: (key: string) => string;
	titleKey: string;
	descriptionKey: string;
	enabledKey: string;
	disabledKey: string;
	disabledDescriptionKey?: string;
	surface?: "card" | "list";
}

export default function NotificationSettingSection({
	enabled,
	onToggle,
	saving,
	disabled = false,
	t,
	titleKey,
	descriptionKey,
	enabledKey,
	disabledKey,
	disabledDescriptionKey,
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
				disabled={saving || disabled}
			>
				{enabled ? t(enabledKey) : t(disabledKey)}
			</Checkbox>

			{disabled && disabledDescriptionKey ? (
				<p
					className={css({
						fontSize: "12px",
						color: "var(--color-warning)",
						marginTop: "8px",
						marginBottom: 0,
					})}
				>
					{t(disabledDescriptionKey)}
				</p>
			) : null}
		</div>
	);
}
