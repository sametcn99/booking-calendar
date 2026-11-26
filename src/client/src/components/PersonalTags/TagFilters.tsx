import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { TagItem } from "../../../../shared/personalTags";
import { useI18n } from "../../context/I18nContext";
import { usePersonalTags } from "../../context/PersonalTagsContext";
import ManageTagsDialog from "./ManageTagsDialog";
import TagPill from "./TagPill";

export function useTagFilters() {
	const { tags, tagsFor } = usePersonalTags();
	const [params, setParams] = useSearchParams();
	const requested = new Set(params.getAll("tag"));
	const selected = tags
		.filter((tag) => requested.has(String(tag.id)))
		.map((tag) => tag.id);
	const onlyTagged = params.get("tagged") === "1";
	const active = selected.length > 0 || onlyTagged;

	function setFilters(ids: number[], tagged: boolean) {
		const next = new URLSearchParams(params);
		next.delete("tag");
		next.delete("tagged");
		for (const id of ids) next.append("tag", String(id));
		if (tagged) next.set("tagged", "1");
		setParams(next, { replace: true, preventScrollReset: true });
	}

	return {
		active,
		selected,
		onlyTagged,
		toggle: (id: number) =>
			setFilters(
				selected.includes(id)
					? selected.filter((value) => value !== id)
					: [...selected, id],
				onlyTagged,
			),
		toggleOnlyTagged: () => setFilters(selected, !onlyTagged),
		matches(item: TagItem) {
			if (!active) return true;
			const assigned = tagsFor(item, false);
			if (selected.length > 0)
				return assigned.some((tag) => selected.includes(tag.id));
			return assigned.length > 0;
		},
	};
}

export default function TagFilters({
	filters,
}: {
	filters: ReturnType<typeof useTagFilters>;
}) {
	const [css] = useStyletron();
	const { t } = useI18n();
	const store = usePersonalTags();
	const [dialog, setDialog] = useState<"manage" | "create" | null>(null);

	return (
		<section
			aria-label={t("personalTags.title")}
			className={css({
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
				gap: "8px",
				padding: "10px 12px",
				marginBottom: "12px",
				backgroundColor: "var(--color-bg-secondary)",
				border: "1px solid var(--color-border-primary)",
				borderRadius: "10px",
			})}
		>
			{store.loadFailed ? (
				<>
					<span role="status">{t("personalTags.loadFailed")}</span>
					<Button
						kind={KIND.secondary}
						size={SIZE.compact}
						onClick={() => void store.refresh()}
					>
						{t("personalTags.retry")}
					</Button>
				</>
			) : !store.ready ? (
				<span role="status">{t("common.loading")}</span>
			) : (
				<>
					{store.tags.length === 0 && (
						<>
							<span
								className={css({
									fontSize: "13px",
									color: "var(--color-text-secondary)",
								})}
							>
								{t("personalTags.onboarding")}
							</span>
							<Button
								size={SIZE.compact}
								kind={KIND.secondary}
								onClick={() => setDialog("create")}
							>
								{t("personalTags.first")}
							</Button>
						</>
					)}
					{(store.tags.length > 0 || filters.onlyTagged) && (
						<Button
							size={SIZE.compact}
							kind={filters.onlyTagged ? KIND.primary : KIND.secondary}
							aria-pressed={filters.onlyTagged}
							onClick={filters.toggleOnlyTagged}
						>
							{t("personalTags.onlyTagged")}
						</Button>
					)}
					{store.tags.map((tag) => {
						const selected = filters.selected.includes(tag.id);
						return (
							<Button
								key={tag.id}
								kind={selected ? KIND.primary : KIND.secondary}
								size={SIZE.mini}
								aria-pressed={selected}
								aria-label={`${t("personalTags.filter")}: ${tag.name}`}
								onClick={() => filters.toggle(tag.id)}
								overrides={{
									BaseButton: {
										style: {
											maxWidth: "100%",
											minHeight: "34px",
											"@media (pointer: coarse)": { minHeight: "44px" },
										},
									},
								}}
							>
								<TagPill tag={tag} />
							</Button>
						);
					})}
					{store.tags.length > 0 && (
						<Button
							size={SIZE.compact}
							kind={KIND.tertiary}
							title={t("personalTags.private")}
							onClick={() => setDialog("manage")}
						>
							<SlidersHorizontal size={14} aria-hidden="true" />
							<span className={css({ marginLeft: "6px" })}>
								{t("personalTags.manage")}
							</span>
						</Button>
					)}
				</>
			)}
			{dialog && (
				<ManageTagsDialog
					startCreating={dialog === "create"}
					onClose={() => setDialog(null)}
				/>
			)}
		</section>
	);
}
