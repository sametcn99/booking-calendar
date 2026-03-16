import { useStyletron } from "baseui";
import AdminEmailSection from "../../DashboardPage/components/AdminEmailSection";
import LanguageSettingsSection from "../../DashboardPage/components/LanguageSettingsSection";
import PasswordSection from "../../DashboardPage/components/PasswordSection";
import type { SettingsPageState } from "../hooks/useSettingsPage";
import CalendarSharingSection from "./CalendarSharingSection";
import ICSExportSection from "./ICSExportSection";
import NotificationSettingSection from "./NotificationSettingSection";
import ThemeColorsSection from "./ThemeColorsSection";
import VersionSection from "./VersionSection";
import WebhookSettingsSection from "./WebhookSettingsSection";

interface Props {
	language: "en" | "tr";
	t: (key: string) => string;
	settings: SettingsPageState;
}

export default function SettingsPageSections({ language, t, settings }: Props) {
	const [css] = useStyletron();
	const emailNotificationDisabled =
		!settings.emailNotificationsEnabled &&
		settings.adminEmail.trim().length === 0;

	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				gap: "14px",
			})}
		>
			<section id="language">
				<LanguageSettingsSection
					language={language}
					onLanguageChange={settings.handleLanguageChange}
					savingLanguage={settings.savingLanguage}
					t={t}
					keyPrefix="settings"
					surface="list"
				/>
			</section>

			<section id="password">
				<PasswordSection
					changingPassword={settings.changingPassword}
					confirmPassword={settings.confirmPassword}
					currentPassword={settings.currentPassword}
					isOpen={settings.isPasswordSectionOpen}
					mustChangePassword={settings.mustChangePassword}
					newPassword={settings.newPassword}
					onSubmit={settings.handleChangePassword}
					onToggleOpen={() =>
						settings.setIsPasswordSectionOpen((prev) => !prev)
					}
					setConfirmPassword={settings.setConfirmPassword}
					setCurrentPassword={settings.setCurrentPassword}
					setNewPassword={settings.setNewPassword}
					t={t}
					keyPrefix="settings"
					surface="list"
				/>
			</section>

			<section id="admin-email">
				<AdminEmailSection
					adminEmail={settings.adminEmail}
					savedAdminEmail={settings.savedAdminEmail}
					onSubmit={settings.handleSaveAdminEmail}
					savingAdminEmail={settings.savingAdminEmail}
					setAdminEmail={settings.setAdminEmail}
					t={t}
					keyPrefix="settings"
					surface="list"
				/>
			</section>

			<section id="calendar-sharing">
				<CalendarSharingSection
					calendarSharingEnabled={settings.calendarSharingEnabled}
					onToggle={settings.handleToggleCalendarSharing}
					saving={settings.savingCalendarSharing}
					t={t}
					surface="list"
				/>
			</section>

			<section id="push">
				<NotificationSettingSection
					enabled={settings.pushNotificationsEnabled}
					onToggle={settings.handleTogglePushNotifications}
					saving={settings.savingPushNotifications}
					t={t}
					titleKey="settings.pushNotifications"
					descriptionKey="settings.pushNotificationsDescription"
					enabledKey="settings.pushNotificationsEnabled"
					disabledKey="settings.pushNotificationsDisabled"
					surface="list"
				/>
			</section>

			<section id="email">
				<NotificationSettingSection
					enabled={settings.emailNotificationsEnabled}
					onToggle={settings.handleToggleEmailNotifications}
					saving={settings.savingEmailNotifications}
					disabled={emailNotificationDisabled}
					t={t}
					titleKey="settings.emailNotifications"
					descriptionKey="settings.emailNotificationsDescription"
					enabledKey="settings.emailNotificationsEnabled"
					disabledKey="settings.emailNotificationsDisabled"
					disabledDescriptionKey="settings.emailNotificationsRequiresAdminEmail"
					surface="list"
				/>
			</section>

			<section id="webhook">
				<WebhookSettingsSection
					outboundEnabled={settings.webhookOutboundEnabled}
					outboundUrl={settings.webhookOutboundUrl}
					outboundSecret={settings.webhookOutboundSecret}
					outboundHasSecret={settings.webhookOutboundHasSecret}
					inboundEnabled={settings.webhookInboundEnabled}
					inboundEndpoint={settings.webhookInboundEndpoint}
					inboundSecret={settings.webhookInboundSecret}
					inboundHasSecret={settings.webhookInboundHasSecret}
					inboundScopes={settings.webhookInboundScopes}
					saving={settings.savingWebhook}
					testing={settings.testingWebhook}
					onOutboundEnabledChange={settings.handleWebhookOutboundEnabledChange}
					onOutboundUrlChange={settings.setWebhookOutboundUrl}
					onOutboundSecretChange={settings.setWebhookOutboundSecret}
					onInboundEnabledChange={settings.handleWebhookInboundEnabledChange}
					onInboundSecretChange={settings.setWebhookInboundSecret}
					onInboundScopeToggle={settings.toggleWebhookInboundScope}
					onSubmit={settings.handleSaveWebhookSettings}
					onSendTest={settings.handleSendWebhookTest}
					t={t}
					surface="list"
				/>
			</section>

			<section id="version">
				<VersionSection
					t={t}
					versionInfo={settings.versionInfo}
					loading={settings.loadingVersionInfo}
					surface="list"
				/>
			</section>

			<section id="theme-colors">
				<ThemeColorsSection t={t} surface="list" />
			</section>

			<section id="ics">
				<ICSExportSection t={t} surface="list" />
			</section>
		</div>
	);
}
