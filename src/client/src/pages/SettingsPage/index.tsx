import { useStyletron } from "baseui";
import { PLACEMENT, ToasterContainer } from "baseui/toast";
import { useI18n } from "../../context/I18nContext";
import AdminEmailSection from "../DashboardPage/components/AdminEmailSection";
import LanguageSettingsSection from "../DashboardPage/components/LanguageSettingsSection";
import PasswordSection from "../DashboardPage/components/PasswordSection";
import CalendarSharingSection from "./components/CalendarSharingSection";
import ICSExportSection from "./components/ICSExportSection";
import NotificationSettingSection from "./components/NotificationSettingSection";
import { useSettingsPage } from "./hooks/useSettingsPage";

export default function SettingsPage() {
	const [css] = useStyletron();
	const { t, language, setLanguage } = useI18n();
	const {
		adminEmail,
		calendarSharingEnabled,
		changingPassword,
		confirmPassword,
		currentPassword,
		emailNotificationsEnabled,
		handleChangePassword,
		handleLanguageChange,
		handleSaveAdminEmail,
		handleToggleCalendarSharing,
		handleToggleEmailNotifications,
		handleTogglePushNotifications,
		isPasswordSectionOpen,
		mustChangePassword,
		newPassword,
		pushNotificationsEnabled,
		savingAdminEmail,
		savingCalendarSharing,
		savingEmailNotifications,
		savingLanguage,
		savingPushNotifications,
		setAdminEmail,
		setConfirmPassword,
		setCurrentPassword,
		setIsPasswordSectionOpen,
		setNewPassword,
	} = useSettingsPage({ t, setLanguage });

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
				{t("settings.title")}
			</h1>

			<div
				className={css({
					display: "grid",
					gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
					gap: "20px",
				})}
			>
				<div
					className={css({
						gridColumn: "1 / -1",
						"@media screen and (min-width: 900px)": {
							gridColumn: "1 / span 6",
						},
					})}
				>
					<LanguageSettingsSection
						language={language}
						onLanguageChange={handleLanguageChange}
						savingLanguage={savingLanguage}
						t={t}
						keyPrefix="settings"
					/>
				</div>

				<div
					className={css({
						gridColumn: "1 / -1",
						"@media screen and (min-width: 900px)": {
							gridColumn: "7 / -1",
							gridRow: "1 / span 2",
						},
					})}
				>
					<PasswordSection
						changingPassword={changingPassword}
						confirmPassword={confirmPassword}
						currentPassword={currentPassword}
						isOpen={isPasswordSectionOpen}
						mustChangePassword={mustChangePassword}
						newPassword={newPassword}
						onSubmit={handleChangePassword}
						onToggleOpen={() => setIsPasswordSectionOpen((prev) => !prev)}
						setConfirmPassword={setConfirmPassword}
						setCurrentPassword={setCurrentPassword}
						setNewPassword={setNewPassword}
						t={t}
						keyPrefix="settings"
					/>
				</div>

				<div
					className={css({
						gridColumn: "1 / -1",
						"@media screen and (min-width: 900px)": {
							gridColumn: "1 / span 6",
						},
					})}
				>
					<AdminEmailSection
						adminEmail={adminEmail}
						onSubmit={handleSaveAdminEmail}
						savingAdminEmail={savingAdminEmail}
						setAdminEmail={setAdminEmail}
						t={t}
						keyPrefix="settings"
					/>
				</div>

				<div
					className={css({
						gridColumn: "1 / -1",
						"@media screen and (min-width: 900px)": {
							gridColumn: "7 / -1",
						},
					})}
				>
					<CalendarSharingSection
						calendarSharingEnabled={calendarSharingEnabled}
						onToggle={handleToggleCalendarSharing}
						saving={savingCalendarSharing}
						t={t}
					/>
				</div>

				<div
					className={css({
						gridColumn: "1 / -1",
						"@media screen and (min-width: 900px)": {
							gridColumn: "1 / span 6",
						},
					})}
				>
					<NotificationSettingSection
						enabled={pushNotificationsEnabled}
						onToggle={handleTogglePushNotifications}
						saving={savingPushNotifications}
						t={t}
						titleKey="settings.pushNotifications"
						descriptionKey="settings.pushNotificationsDescription"
						enabledKey="settings.pushNotificationsEnabled"
						disabledKey="settings.pushNotificationsDisabled"
					/>
				</div>

				<div
					className={css({
						gridColumn: "1 / -1",
						"@media screen and (min-width: 900px)": {
							gridColumn: "7 / -1",
						},
					})}
				>
					<NotificationSettingSection
						enabled={emailNotificationsEnabled}
						onToggle={handleToggleEmailNotifications}
						saving={savingEmailNotifications}
						t={t}
						titleKey="settings.emailNotifications"
						descriptionKey="settings.emailNotificationsDescription"
						enabledKey="settings.emailNotificationsEnabled"
						disabledKey="settings.emailNotificationsDisabled"
					/>
				</div>

				<div
					className={css({
						gridColumn: "1 / -1",
						"@media screen and (min-width: 900px)": {
							gridColumn: "1 / span 6",
						},
					})}
				>
					<ICSExportSection t={t} />
				</div>
			</div>
		</div>
	);
}
