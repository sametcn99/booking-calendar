import { useStyletron } from "baseui";
import { PLACEMENT, ToasterContainer } from "baseui/toast";
import { useI18n } from "../../context/I18nContext";
import CommunityEventsSection from "../SettingsPage/components/CommunityEventsSection";

export default function EventsPage() {
	const [css] = useStyletron();
	const { t } = useI18n();

	return (
		<div>
			<ToasterContainer placement={PLACEMENT.bottomRight} />

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
					marginBottom: "24px",
					maxWidth: "760px",
				})}
			>
				{t("communityEvents.pageDescription")}
			</p>

			<CommunityEventsSection t={t} />
		</div>
	);
}
