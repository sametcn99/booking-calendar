import { useStyletron } from "baseui";
import { PLACEMENT, ToasterContainer } from "baseui/toast";
import { useI18n } from "../../context/I18nContext";
import SettingsPageHeader from "./components/SettingsPageHeader";
import SettingsPageSections from "./components/SettingsPageSections";
import SettingsPageSidebar from "./components/SettingsPageSidebar";
import { useSettingsPage } from "./hooks/useSettingsPage";

export default function SettingsPage() {
	const [css] = useStyletron();
	const { t, language, setLanguage } = useI18n();
	const settingsPage = useSettingsPage({ t, setLanguage });

	return (
		<div>
			<ToasterContainer placement={PLACEMENT.bottomRight} />

			<SettingsPageHeader
				title={t("settings.title")}
				description={t("settings.description")}
			/>

			<div
				className={css({
					display: "grid",
					gap: "24px",
					gridTemplateColumns: "1fr",
					alignItems: "start",
					"@media screen and (min-width: 1100px)": {
						gridTemplateColumns: "260px minmax(0, 1fr)",
					},
				})}
			>
				<SettingsPageSidebar t={t} />
				<SettingsPageSections
					language={language}
					t={t}
					settings={settingsPage}
				/>
			</div>
		</div>
	);
}
