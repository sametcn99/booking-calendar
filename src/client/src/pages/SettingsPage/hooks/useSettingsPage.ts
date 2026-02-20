import { toaster } from "baseui/toast";
import { useCallback, useEffect, useState } from "react";
import { type ApiVersionInfo, api } from "../../../api";

interface Params {
	t: (key: string) => string;
	setLanguage: (lang: "en" | "tr") => Promise<void>;
}

function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) return error.message;
	return fallback;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; i++) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

export function useSettingsPage({ setLanguage, t }: Params) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [changingPassword, setChangingPassword] = useState(false);
	const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
	const [mustChangePassword, setMustChangePassword] = useState(false);
	const [savingLanguage, setSavingLanguage] = useState(false);
	const [adminEmail, setAdminEmail] = useState("");
	const [savingAdminEmail, setSavingAdminEmail] = useState(false);
	const [calendarSharingEnabled, setCalendarSharingEnabled] = useState(false);
	const [savingCalendarSharing, setSavingCalendarSharing] = useState(false);
	const [pushNotificationsEnabled, setPushNotificationsEnabled] =
		useState(false);
	const [savingPushNotifications, setSavingPushNotifications] = useState(false);
	const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
		useState(false);
	const [savingEmailNotifications, setSavingEmailNotifications] =
		useState(false);
	const [versionInfo, setVersionInfo] = useState<ApiVersionInfo | null>(null);
	const [loadingVersionInfo, setLoadingVersionInfo] = useState(true);
	const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

	useEffect(() => {
		setMustChangePassword(
			localStorage.getItem("must_change_password") === "true",
		);
	}, []);

	useEffect(() => {
		if (mustChangePassword) setIsPasswordSectionOpen(true);
	}, [mustChangePassword]);

	useEffect(() => {
		api
			.getAdminEmail()
			.then((email) => setAdminEmail(email))
			.catch(() => {});
	}, []);

	useEffect(() => {
		api
			.getCalendarSharing()
			.then((enabled) => setCalendarSharingEnabled(enabled))
			.catch(() => {});
	}, []);

	useEffect(() => {
		api
			.getPushNotifications()
			.then((enabled) => setPushNotificationsEnabled(enabled))
			.catch(() => {});
	}, []);

	useEffect(() => {
		api
			.getEmailNotifications()
			.then((enabled) => setEmailNotificationsEnabled(enabled))
			.catch(() => {});
	}, []);

	useEffect(() => {
		api
			.getVersionInfo()
			.then((data) => setVersionInfo(data))
			.catch(() => {})
			.finally(() => setLoadingVersionInfo(false));
	}, []);

	const handleChangePassword = useCallback(
		async (event: React.FormEvent) => {
			event.preventDefault();

			if (newPassword !== confirmPassword) {
				toaster.negative(t("settings.passwordMismatch"), {});
				return;
			}

			setChangingPassword(true);
			try {
				await api.changePassword(currentPassword, newPassword);
				toaster.positive(t("settings.passwordChanged"), {});
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
				setMustChangePassword(false);
				localStorage.setItem("must_change_password", "false");
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setChangingPassword(false);
			}
		},
		[confirmPassword, currentPassword, newPassword, t],
	);

	const handleLanguageChange = useCallback(
		async (lang: "en" | "tr") => {
			setSavingLanguage(true);
			try {
				await setLanguage(lang);
				toaster.positive(t("settings.languageSaved"), {});
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setSavingLanguage(false);
			}
		},
		[setLanguage, t],
	);

	const handleSaveAdminEmail = useCallback(
		async (event: React.FormEvent) => {
			event.preventDefault();
			setSavingAdminEmail(true);
			try {
				const response = await api.setAdminEmail(adminEmail);
				setAdminEmail(response.data.email);
				toaster.positive(t("settings.adminEmailSaved"), {});
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setSavingAdminEmail(false);
			}
		},
		[adminEmail, t],
	);

	const handleToggleCalendarSharing = useCallback(
		async (enabled: boolean) => {
			setSavingCalendarSharing(true);
			try {
				await api.setCalendarSharing(enabled);
				setCalendarSharingEnabled(enabled);
				toaster.positive(t("settings.calendarSharingSaved"), {});
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setSavingCalendarSharing(false);
			}
		},
		[t],
	);

	const handleTogglePushNotifications = useCallback(
		async (enabled: boolean) => {
			setSavingPushNotifications(true);
			try {
				if (enabled) {
					if (!publicVapidKey) {
						throw new Error("VAPID key missing");
					}

					if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
						throw new Error("Push is not supported");
					}

					if (!("Notification" in window)) {
						throw new Error("Notifications are not supported");
					}

					const permission =
						Notification.permission === "granted"
							? "granted"
							: await Notification.requestPermission();
					if (permission !== "granted") {
						throw new Error("Notification permission denied");
					}

					let registration = await navigator.serviceWorker.getRegistration();
					if (!registration) {
						registration = await navigator.serviceWorker.ready;
					}

					const existingSubscription =
						await registration.pushManager.getSubscription();
					if (existingSubscription) {
						await api.subscribeToPush(existingSubscription);
					} else {
						const newSubscription = await registration.pushManager.subscribe({
							userVisibleOnly: true,
							applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
						});
						await api.subscribeToPush(newSubscription);
					}
				}

				await api.setPushNotifications(enabled);
				setPushNotificationsEnabled(enabled);
				toaster.positive(t("settings.pushNotificationsSaved"), {});
			} catch {
				toaster.negative(t("common.error"), {});
			} finally {
				setSavingPushNotifications(false);
			}
		},
		[t],
	);

	const handleToggleEmailNotifications = useCallback(
		async (enabled: boolean) => {
			setSavingEmailNotifications(true);
			try {
				await api.setEmailNotifications(enabled);
				setEmailNotificationsEnabled(enabled);
				toaster.positive(t("settings.emailNotificationsSaved"), {});
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setSavingEmailNotifications(false);
			}
		},
		[t],
	);

	return {
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
		loadingVersionInfo,
		setAdminEmail,
		setConfirmPassword,
		setCurrentPassword,
		setIsPasswordSectionOpen,
		setNewPassword,
		versionInfo,
	};
}
