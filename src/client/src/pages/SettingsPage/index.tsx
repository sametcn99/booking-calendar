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
		<div
			className={css({
				maxWidth: "1240px",
				margin: "0 auto",
			})}
		>
			<ToasterContainer placement={PLACEMENT.bottomRight} />

			<h1
				className={css({
					fontSize: "30px",
					fontWeight: 700,
					color: "var(--color-text-primary)",
					marginBottom: "8px",
				})}
			>
				{t("settings.title")}
			</h1>
			<p
				className={css({
					fontSize: "14px",
					lineHeight: 1.5,
					color: "var(--color-text-subtle)",
					marginBottom: "22px",
				})}
			>
				{t("settings.description")}
			</p>

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
				<aside
					className={css({
						display: "none",
						"@media screen and (min-width: 1100px)": {
							display: "block",
							position: "sticky",
							top: "24px",
							alignSelf: "start",
						},
					})}
				>
					<div
						className={css({
							padding: "14px",
							borderRadius: "10px",
							border: "1px solid var(--color-bg-quaternary)",
							backgroundColor: "var(--color-bg-secondary)",
						})}
					>
						<div
							className={css({
								fontSize: "12px",
								textTransform: "uppercase",
								letterSpacing: "0.04em",
								fontWeight: 700,
								color: "var(--color-text-subtle)",
								marginBottom: "10px",
							})}
						>
							{t("settings.title")}
						</div>
						<nav
							className={css({
								display: "flex",
								flexDirection: "column",
								gap: "8px",
							})}
						>
							{[
								{ id: "language", label: t("settings.language") },
								{ id: "password", label: t("settings.changePassword") },
								{ id: "admin-email", label: t("settings.adminEmail") },
								{
									id: "calendar-sharing",
									label: t("settings.calendarSharing"),
								},
								{ id: "push", label: t("settings.pushNotifications") },
								{ id: "email", label: t("settings.emailNotifications") },
								{ id: "ics", label: t("settings.icsExport") },
							].map((item) => (
								<a
									key={item.id}
									href={`#${item.id}`}
									className={css({
										fontSize: "13px",
										fontWeight: 500,
										color: "var(--color-text-secondary)",
										padding: "7px 10px",
										borderRadius: "8px",
										border: "1px solid transparent",
										textDecoration: "none",
										":hover": {
											backgroundColor: "var(--color-bg-tertiary)",
											borderColor: "var(--color-bg-quaternary)",
										},
									})}
								>
									{item.label}
								</a>
							))}
						</nav>
					</div>
				</aside>

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
							onLanguageChange={handleLanguageChange}
							savingLanguage={savingLanguage}
							t={t}
							keyPrefix="settings"
							surface="list"
						/>
					</section>

					<section id="password">
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
							surface="list"
						/>
					</section>

					<section id="admin-email">
						<AdminEmailSection
							adminEmail={adminEmail}
							onSubmit={handleSaveAdminEmail}
							savingAdminEmail={savingAdminEmail}
							setAdminEmail={setAdminEmail}
							t={t}
							keyPrefix="settings"
							surface="list"
						/>
					</section>

					<section id="calendar-sharing">
						<CalendarSharingSection
							calendarSharingEnabled={calendarSharingEnabled}
							onToggle={handleToggleCalendarSharing}
							saving={savingCalendarSharing}
							t={t}
							surface="list"
						/>
					</section>

					<section id="push">
						<NotificationSettingSection
							enabled={pushNotificationsEnabled}
							onToggle={handleTogglePushNotifications}
							saving={savingPushNotifications}
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
							enabled={emailNotificationsEnabled}
							onToggle={handleToggleEmailNotifications}
							saving={savingEmailNotifications}
							t={t}
							titleKey="settings.emailNotifications"
							descriptionKey="settings.emailNotificationsDescription"
							enabledKey="settings.emailNotificationsEnabled"
							disabledKey="settings.emailNotificationsDisabled"
							surface="list"
						/>
					</section>

					<section id="ics">
						<ICSExportSection t={t} surface="list" />
					</section>
				</div>
			</div>
		</div>
	);
}
