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
}

export default function CalendarSharingSection({
	calendarSharingEnabled,
	onToggle,
	saving,
	t,
}: Props) {
	const [css] = useStyletron();

	const publicLink = `${window.location.origin}/calendar`;

	const handleCopy = async () => {
		await navigator.clipboard.writeText(publicLink);
		toaster.positive(t("settings.copied"), {});
	};

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
				{t("settings.calendarSharing")}
			</h2>
			<div
				className={css({
					fontSize: "13px",
					color: "#b8a9d4",
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
						backgroundColor: "#1e1e1e",
						borderRadius: "8px",
						border: "1px solid #2a2a2a",
					})}
				>
					<div
						className={css({
							fontSize: "13px",
							color: "#b8a9d4",
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
								color: "#a78bfa",
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
