import { useStyletron } from "baseui";
import { HIERARCHY, KIND, Tag } from "baseui/tag";
import { useI18n } from "../../context/I18nContext";

interface Props {
	count: number;
	totalCount: number;
	isActive: boolean;
	search?: string;
	from?: string;
	to?: string;
	t: (key: string) => string;
}

export default function ListFiltersFeedback({
	count,
	totalCount,
	isActive,
	search,
	from,
	to,
	t,
}: Props) {
	const [css] = useStyletron();
	const { locale } = useI18n();

	const formatDate = (d: string) =>
		new Date(d).toLocaleDateString(locale, {
			month: "short",
			day: "numeric",
			year: "numeric",
		});

	if (!isActive && count === totalCount) {
		return (
			<div
				className={css({
					marginBottom: "16px",
					fontSize: "14px",
					color: "var(--color-text-tertiary)",
				})}
			>
				{t("common.showingAll").replace("{count}", String(totalCount))}
			</div>
		);
	}

	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				marginBottom: "16px",
			})}
		>
			<div
				className={css({
					fontSize: "14px",
					fontWeight: 500,
					color: "var(--color-text-primary)",
				})}
			>
				{t("common.showingResults")
					.replace("{count}", String(count))
					.replace("{total}", String(totalCount))}
			</div>
			{isActive && (
				<div
					className={css({
						display: "flex",
						gap: "8px",
						flexWrap: "wrap",
						alignItems: "center",
					})}
				>
					<span
						className={css({
							fontSize: "12px",
							color: "var(--color-text-muted)",
						})}
					>
						{t("common.activeFilters")}:
					</span>
					{search && (
						<Tag
							closeable={false}
							hierarchy={HIERARCHY.secondary}
							kind={KIND.neutral}
						>
							{t("common.search")}: {search}
						</Tag>
					)}
					{(from || to) && (
						<Tag
							closeable={false}
							hierarchy={HIERARCHY.secondary}
							kind={KIND.neutral}
						>
							{t("common.dateRange")}: {from ? formatDate(from) : "..."} —{" "}
							{to ? formatDate(to) : "..."}
						</Tag>
					)}
				</div>
			)}
		</div>
	);
}
