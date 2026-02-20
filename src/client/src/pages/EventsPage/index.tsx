import { useStyletron } from "baseui";
import { Button } from "baseui/button";
import { PLACEMENT, ToasterContainer } from "baseui/toast";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useI18n } from "../../context/I18nContext";
import CommunityEventsSection from "../SettingsPage/components/CommunityEventsSection";

export default function EventsPage() {
	const [css] = useStyletron();
	const { t } = useI18n();
	const [showForm, setShowForm] = useState(false);

	return (
		<div>
			<ToasterContainer placement={PLACEMENT.bottomRight} />

			<div
				className={css({
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					marginBottom: "24px",
					gap: "16px",
				})}
			>
				<div>
					<h1
						className={css({
							fontSize: "28px",
							fontWeight: 700,
							color: "var(--color-text-primary)",
							marginTop: 0,
							marginBottom: "8px",
						})}
					>
						{t("communityEvents.title")}
					</h1>
					<p
						className={css({
							fontSize: "14px",
							lineHeight: 1.5,
							color: "var(--color-text-subtle)",
							marginTop: 0,
							marginBottom: 0,
							maxWidth: "760px",
						})}
					>
						{t("communityEvents.pageDescription")}
					</p>
				</div>
				<Button
					onClick={() => setShowForm(true)}
					className={css({ flexShrink: 0 })}
				>
					<Plus size={14} />
					<span className={css({ marginLeft: "6px" })}>
						{t("communityEvents.create")}
					</span>
				</Button>
			</div>

			<CommunityEventsSection
				t={t}
				showForm={showForm}
				setShowForm={setShowForm}
			/>
		</div>
	);
}
