import { useStyletron } from "baseui";
import { X } from "lucide-react";
import type { PersonalTag, TagColor } from "../../../../shared/personalTags";
import { useI18n } from "../../context/I18nContext";

export const tagPalette: Record<
	TagColor,
	{ background: string; text: string }
> = {
	slate: { background: "#e2e8f0", text: "#1e293b" },
	blue: { background: "#dbeafe", text: "#1e3a8a" },
	teal: { background: "#ccfbf1", text: "#134e4a" },
	green: { background: "#dcfce7", text: "#14532d" },
	amber: { background: "#fef3c7", text: "#78350f" },
	rose: { background: "#ffe4e6", text: "#881337" },
	violet: { background: "#ede9fe", text: "#4c1d95" },
};

export const tagFocusStyle = {
	outline: "2px solid var(--color-text-primary)",
	outlineOffset: "2px",
};

export default function TagPill({
	tag,
	onRemove,
	disabled,
	animate,
}: {
	tag: Pick<PersonalTag, "name" | "color">;
	onRemove?: () => void;
	disabled?: boolean;
	animate?: boolean;
}) {
	const [css] = useStyletron();
	const { t } = useI18n();
	const colors = tagPalette[tag.color];
	return (
		<span
			title={tag.name}
			className={css({
				display: "inline-flex",
				alignItems: "center",
				boxSizing: "border-box",
				minWidth: 0,
				maxWidth: "100%",
				minHeight: "26px",
				borderRadius: "999px",
				paddingLeft: "10px",
				paddingRight: onRemove ? "2px" : "10px",
				backgroundColor: colors.background,
				color: colors.text,
				fontSize: "12px",
				fontWeight: 650,
				animationName: animate
					? {
							from: { opacity: 0, transform: "translateY(3px)" },
							to: { opacity: 1, transform: "translateY(0)" },
						}
					: undefined,
				animationDuration: "150ms",
				"@media (prefers-reduced-motion: reduce)": { animationDuration: "0ms" },
			})}
		>
			<span
				className={css({
					whiteSpace: "nowrap",
					overflow: "hidden",
					textOverflow: "ellipsis",
					maxWidth: "20ch",
				})}
			>
				{tag.name}
			</span>
			{onRemove && (
				<button
					type="button"
					aria-label={`${t("personalTags.remove")}: ${tag.name}`}
					onClick={onRemove}
					disabled={disabled}
					className={css({
						display: "grid",
						placeItems: "center",
						flexShrink: 0,
						width: "26px",
						height: "26px",
						padding: 0,
						marginLeft: "4px",
						backgroundColor: "transparent",
						color: "inherit",
						border: "none",
						borderRadius: "50%",
						cursor: disabled ? "wait" : "pointer",
						":hover": { backgroundColor: "rgba(0, 0, 0, 0.1)" },
						":focus-visible": tagFocusStyle,
						"@media (pointer: coarse)": { width: "44px", height: "44px" },
					})}
				>
					<X size={14} aria-hidden="true" />
				</button>
			)}
		</span>
	);
}
