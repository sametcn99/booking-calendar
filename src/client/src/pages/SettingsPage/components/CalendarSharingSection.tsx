import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Checkbox, STYLE_TYPE } from "baseui/checkbox";
import { toaster } from "baseui/toast";
import { Copy } from "lucide-react";

interface Props {
	calendarSharingEnabled: boolean;
	onToggle: (enabled: boolean) => void;
	saving: boolean;
	t: (key: string) => string;
	surface?: "card" | "list";
}

export default function CalendarSharingSection({
	calendarSharingEnabled,
	onToggle,
	saving,
	t,
	surface = "card",
}: Props) {
	const [css] = useStyletron();
	const isList = surface === "list";

	const publicLink = `${window.location.origin}/calendar`;

	const handleCopy = async () => {
		await navigator.clipboard.writeText(publicLink);
		toaster.positive(t("settings.copied"), {});
	};

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
				{t("settings.calendarSharing")}
			</h2>
			<div
				className={css({
					fontSize: "13px",
					color: "var(--color-text-secondary)",
					marginBottom: "14px",
				})}
			>
				{t("settings.calendarSharingDescription")}
			</div>

			<Checkbox
				checked={calendarSharingEnabled}
				onChange={(e) => onToggle(e.currentTarget.checked)}
				checkmarkType={STYLE_TYPE.toggle_round}
				disabled={saving}
			>
				{calendarSharingEnabled
					? t("settings.calendarSharingEnabled")
					: t("settings.calendarSharingDisabled")}
			</Checkbox>

			{calendarSharingEnabled && (
				<div
					className={css({
						marginTop: "16px",
						padding: "12px 16px",
						backgroundColor: "var(--color-bg-tertiary)",
						borderRadius: "8px",
						border: "1px solid var(--color-bg-quaternary)",
					})}
				>
					<div
						className={css({
							fontSize: "13px",
							color: "var(--color-text-secondary)",
							marginBottom: "8px",
						})}
					>
						{t("settings.publicCalendarLink")}
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
								fontSize: "13px",
								color: "var(--color-accent-800)",
								wordBreak: "break-all",
							})}
						>
							{publicLink}
						</code>
						<Button kind={KIND.secondary} size={SIZE.mini} onClick={handleCopy}>
							<Copy size={14} />
							<span className={css({ marginLeft: "4px" })}>
								{t("settings.copyLink")}
							</span>
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
