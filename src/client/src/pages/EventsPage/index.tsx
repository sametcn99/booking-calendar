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
					color: "#e0d6f0",
					marginBottom: "24px",
				})}
			>
				{t("communityEvents.title")}
			</h1>

			<CommunityEventsSection t={t} />
		</div>
	);
}
