import { useStyletron } from "baseui";
import type { BookingLink } from "../hooks/useLinksPage";
import LinkCard from "./LinkCard";

interface Props {
	formatDate: (d: string) => string;
	links: BookingLink[];
	onCopy: (text: string) => void;
	onDelete: (id: number) => void;
	t: (key: string) => string;
}

export default function LinksListSection({
	formatDate,
	links,
	onCopy,
	onDelete,
	t,
}: Props) {
	const [css] = useStyletron();

	return (
		<div className={css({ display: "grid", gap: "12px" })}>
			{links.length === 0 && (
				<div
					className={css({
						textAlign: "center",
						padding: "48px",
						color: "var(--color-text-tertiary)",
					})}
				>
					{t("links.empty")}
				</div>
			)}

			{links.map((link) => (
				<LinkCard
					key={link.id}
					link={link}
					formatDate={formatDate}
					onCopy={onCopy}
					onDelete={onDelete}
					t={t}
				/>
			))}
		</div>
	);
}
