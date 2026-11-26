import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { useState } from "react";
import { useI18n } from "../../context/I18nContext";
import AdminItemDetails, { type AdminItem } from "./AdminItemDetails";
import { ItemTags } from "./TagPicker";
import { SelectTagItem, type useTagSelection } from "./TagSelection";

export type TagSelection = ReturnType<typeof useTagSelection>;

export default function TagListRow({
	item,
	label,
	selection,
}: {
	item: Exclude<AdminItem, { type: "slot" }>;
	label: string;
	selection: TagSelection;
}) {
	const [css] = useStyletron();
	const { t } = useI18n();
	const [showDetails, setShowDetails] = useState(false);
	const id = item.data.id;
	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				flexWrap: "wrap",
				gap: "6px",
				marginTop: "10px",
				minWidth: 0,
			})}
		>
			<SelectTagItem selection={selection} id={id} label={label} />
			<ItemTags item={{ kind: item.type, itemId: id }} label={label} />
			{item.type !== "planner" && (
				<Button
					kind={KIND.tertiary}
					size={SIZE.mini}
					aria-label={`${t("personalTags.details")}: ${label}`}
					onClick={() => setShowDetails(true)}
					overrides={{
						BaseButton: {
							style: { "@media (pointer: coarse)": { minHeight: "44px" } },
						},
					}}
				>
					{t("personalTags.details")}
				</Button>
			)}
			{showDetails && (
				<AdminItemDetails
					item={item}
					title={label}
					onClose={() => setShowDetails(false)}
				/>
			)}
		</div>
	);
}
