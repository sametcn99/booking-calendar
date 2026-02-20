import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import type { BookingLink } from "../hooks/useLinksPage";

interface Props {
	link: BookingLink;
	formatDate: (date: string) => string;
	onCopy: (text: string) => void;
	onDelete: (id: number) => void;
	t: (key: string) => string;
}

export default function LinkCard({
	link,
	formatDate,
	onCopy,
	onDelete,
	t,
}: Props) {
	const [css] = useStyletron();
	const expired = new Date(link.expires_at) < new Date();
	const url = `${window.location.origin}/book/${link.slug_id}`;

	return (
		<div
			className={css({
				backgroundColor: "#141414",
				borderRadius: "8px",
				padding: "16px 20px",
				border: "1px solid #2a2a2a",
			})}
		>
			<div
				className={css({
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "12px",
					flexWrap: "wrap",
				})}
			>
				<div className={css({ flex: 1, minWidth: "200px" })}>
					<div
						className={css({
							fontSize: "15px",
							fontWeight: 600,
							color: "#f1e9ff",
							marginBottom: "6px",
						})}
					>
						{link.name}
					</div>
					<div
						className={css({
							fontSize: "13px",
							color: "#b8a9d4",
							marginBottom: "4px",
							wordBreak: "break-all",
							fontFamily: "monospace",
						})}
					>
						{url}
					</div>
					<div
						className={css({
							fontSize: "12px",
							color: expired ? "#fca5a5" : "#8b7aab",
							marginBottom: "2px",
						})}
					>
						{expired
							? t("links.expired")
							: `${t("links.expires")}: ${formatDate(link.expires_at)}`}
					</div>
					<div
						className={css({
							fontSize: "12px",
							color: "#8b7aab",
						})}
					>
						{t("links.slotCount")}: {link.allowed_slot_ids.length}
					</div>
				</div>
				<div className={css({ display: "flex", gap: "8px" })}>
					<Button
						kind={KIND.secondary}
						size={SIZE.compact}
						onClick={() => onCopy(url)}
					>
						{t("links.copy")}
					</Button>
					<Button
						kind={KIND.secondary}
						size={SIZE.compact}
						onClick={() => onDelete(link.id)}
						overrides={{
							BaseButton: {
								style: {
									backgroundColor: "#3b1025",
									color: "#fca5a5",
									":hover": { backgroundColor: "#4d1530" },
								},
							},
						}}
					>
						{t("links.delete")}
					</Button>
				</div>
			</div>
		</div>
	);
}
