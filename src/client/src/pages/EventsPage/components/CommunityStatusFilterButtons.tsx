import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import type { CommunityStatusFilter } from "./types";

interface Props {
	setStatusFilter: (value: CommunityStatusFilter) => void;
	statusFilter: CommunityStatusFilter;
	t: (key: string) => string;
}

export default function CommunityStatusFilterButtons({
	setStatusFilter,
	statusFilter,
	t,
}: Props) {
	const [css] = useStyletron();

	return (
		<div
			className={css({
				display: "flex",
				gap: "8px",
				marginBottom: "14px",
				flexWrap: "wrap",
			})}
		>
			<Button
				kind={statusFilter === "all" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => setStatusFilter("all")}
			>
				{t("communityEvents.all")}
			</Button>
			<Button
				kind={statusFilter === "pending" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => setStatusFilter("pending")}
			>
				{t("communityEvents.statusPending")}
			</Button>
			<Button
				kind={statusFilter === "active" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => setStatusFilter("active")}
			>
				{t("communityEvents.statusActive")}
			</Button>
			<Button
				kind={statusFilter === "canceled" ? KIND.primary : KIND.secondary}
				size={SIZE.compact}
				onClick={() => setStatusFilter("canceled")}
			>
				{t("communityEvents.statusCanceled")}
			</Button>
		</div>
	);
}
