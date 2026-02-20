import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { useState } from "react";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
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
	const [confirmOpen, setConfirmOpen] = useState(false);
	const expired = new Date(link.expires_at) < new Date();
	const url = `${window.location.origin}/book/${link.slug_id}`;

	const handleConfirmDelete = () => {
		onDelete(link.id);
		setConfirmOpen(false);
	};

	return (
		<>
			<div
				className={css({
					backgroundColor: "var(--color-bg-secondary)",
					borderRadius: "8px",
					padding: "16px 20px",
					border: "1px solid var(--color-bg-quaternary)",
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
								color: "var(--color-text-primary)",
								marginBottom: "6px",
							})}
						>
							{link.name}
						</div>
						<div
							className={css({
								fontSize: "13px",
								color: "var(--color-text-secondary)",
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
								color: expired
									? "var(--color-error-text)"
									: "var(--color-text-tertiary)",
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
								color: "var(--color-text-tertiary)",
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
							onClick={() => setConfirmOpen(true)}
							overrides={{
								BaseButton: {
									style: {
										backgroundColor: "var(--color-error-bg)",
										color: "var(--color-error-text)",
										":hover": { backgroundColor: "var(--color-error-hover)" },
									},
								},
							}}
						>
							{t("links.delete")}
						</Button>
					</div>
				</div>
			</div>

			<ConfirmationDialog
				isOpen={confirmOpen}
				title={t("common.confirmationTitle")}
				message={t("common.confirmDeleteMessage")}
				confirmLabel={t("common.confirm")}
				cancelLabel={t("common.cancel")}
				onConfirm={handleConfirmDelete}
				onClose={() => setConfirmOpen(false)}
			/>
		</>
	);
}
