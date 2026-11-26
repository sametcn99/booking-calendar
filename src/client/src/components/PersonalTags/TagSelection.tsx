import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { useEffect, useMemo, useState } from "react";
import { type TagKind, tagBatchMaxSize } from "../../../../shared/personalTags";
import { useI18n } from "../../context/I18nContext";
import { usePersonalTags } from "../../context/PersonalTagsContext";
import { TagPicker } from "./TagPicker";

export function useTagSelection(kind: TagKind, items: { id: number }[]) {
	const [selected, setSelected] = useState<number[]>([]);
	const visible = useMemo(() => new Set(items.map((item) => item.id)), [items]);

	useEffect(() => {
		setSelected((current) => {
			const remaining = current.filter((id) => visible.has(id));
			return remaining.length === current.length ? current : remaining;
		});
	}, [visible]);

	const visibleSelection = selected.filter((id) => visible.has(id));
	return {
		items: visibleSelection.map((itemId) => ({ kind, itemId })),
		includes: (id: number) => visibleSelection.includes(id),
		atLimit: visibleSelection.length >= tagBatchMaxSize,
		toggle: (id: number) =>
			setSelected((current) => {
				if (current.includes(id))
					return current.filter((value) => value !== id);
				const remaining = current.filter((value) => visible.has(value));
				return remaining.length < tagBatchMaxSize
					? [...remaining, id]
					: remaining;
			}),
		clear: () => setSelected([]),
	};
}

type Selection = ReturnType<typeof useTagSelection>;

export function SelectTagItem({
	selection,
	id,
	label,
}: {
	selection: Selection;
	id: number;
	label: string;
}) {
	const [css] = useStyletron();
	const { ready, saving } = usePersonalTags();
	const { t } = useI18n();
	const checked = selection.includes(id);
	return (
		<label
			className={css({
				display: "inline-grid",
				placeItems: "center",
				minWidth: "32px",
				minHeight: "32px",
				cursor: "pointer",
				"@media (pointer: coarse)": { minWidth: "44px", minHeight: "44px" },
			})}
		>
			<input
				type="checkbox"
				aria-label={`${t("personalTags.selectItem")}: ${label}`}
				checked={checked}
				disabled={!ready || saving || (!checked && selection.atLimit)}
				onChange={() => selection.toggle(id)}
				className={css({
					margin: 0,
					width: "16px",
					height: "16px",
					accentColor: "var(--color-accent-600)",
				})}
			/>
		</label>
	);
}

export function TagBulkActions({ selection }: { selection: Selection }) {
	const [css] = useStyletron();
	const { t } = useI18n();
	const { saving } = usePersonalTags();
	if (!selection.items.length) return null;
	return (
		<fieldset
			aria-label={t("personalTags.bulk")}
			className={css({
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
				gap: "8px",
				padding: "8px 12px",
				borderRadius: "10px",
				border: "1px solid var(--color-border-primary)",
				margin: "0 0 12px",
				minWidth: 0,
			})}
		>
			<span role="status">
				{t("personalTags.selected").replace(
					"{count}",
					String(selection.items.length),
				)}
			</span>
			<TagPicker items={selection.items} />
			<TagPicker items={selection.items} action="remove" />
			<Button
				kind={KIND.tertiary}
				size={SIZE.compact}
				disabled={saving}
				onClick={selection.clear}
			>
				{t("personalTags.clearSelection")}
			</Button>
		</fieldset>
	);
}
