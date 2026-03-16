import { toaster } from "baseui/toast";
import { useCallback, useEffect, useState } from "react";
import {
	type ApiVersionInfo,
	type ApiWebhookSettings,
	api,
} from "../../../api";
import { useAuth } from "../../../context/AuthContext";

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

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	return bytes.buffer.slice(
		bytes.byteOffset,
		bytes.byteOffset + bytes.byteLength,
	) as ArrayBuffer;
}

function applyWebhookSettings(
	settings: ApiWebhookSettings,
	setWebhookOutboundEnabled: (value: boolean) => void,
	setWebhookOutboundUrl: (value: string) => void,
	setWebhookOutboundHasSecret: (value: boolean) => void,
	setWebhookInboundEnabled: (value: boolean) => void,
	setWebhookInboundEndpoint: (value: string) => void,
	setWebhookInboundHasSecret: (value: boolean) => void,
	setWebhookInboundScopes: (value: string[]) => void,
) {
	setWebhookOutboundEnabled(settings.outbound.enabled);
	setWebhookOutboundUrl(settings.outbound.url);
	setWebhookOutboundHasSecret(settings.outbound.has_secret);
	setWebhookInboundEnabled(settings.inbound.enabled);
	setWebhookInboundEndpoint(settings.inbound.endpoint);
	setWebhookInboundHasSecret(settings.inbound.has_secret);
	setWebhookInboundScopes(settings.inbound.scopes);
}

export function useSettingsPage({ setLanguage, t }: Params) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [changingPassword, setChangingPassword] = useState(false);
	const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
	const { markPasswordChanged, mustChangePassword } = useAuth();
	const [savingLanguage, setSavingLanguage] = useState(false);
	const [adminEmail, setAdminEmail] = useState("");
	const [savedAdminEmail, setSavedAdminEmail] = useState("");
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
	const [webhookOutboundEnabled, setWebhookOutboundEnabled] = useState(false);
	const [webhookOutboundUrl, setWebhookOutboundUrl] = useState("");
	const [webhookOutboundSecret, setWebhookOutboundSecret] = useState("");
	const [webhookOutboundHasSecret, setWebhookOutboundHasSecret] =
		useState(false);
	const [webhookInboundEnabled, setWebhookInboundEnabled] = useState(false);
	const [webhookInboundEndpoint, setWebhookInboundEndpoint] = useState("");
	const [webhookInboundSecret, setWebhookInboundSecret] = useState("");
	const [webhookInboundHasSecret, setWebhookInboundHasSecret] = useState(false);
	const [webhookInboundScopes, setWebhookInboundScopes] = useState<string[]>(
		[],
	);
	const [savingWebhook, setSavingWebhook] = useState(false);
	const [testingWebhook, setTestingWebhook] = useState(false);
	const [versionInfo, setVersionInfo] = useState<ApiVersionInfo | null>(null);
	const [loadingVersionInfo, setLoadingVersionInfo] = useState(true);
	const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

	useEffect(() => {
		if (mustChangePassword) setIsPasswordSectionOpen(true);
	}, [mustChangePassword]);

	useEffect(() => {
		api
			.getAdminEmail()
			.then((email) => {
				setAdminEmail(email);
				setSavedAdminEmail(email);
			})
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
			.getWebhookSettings()
			.then((settings) => {
				applyWebhookSettings(
					settings,
					setWebhookOutboundEnabled,
					setWebhookOutboundUrl,
					setWebhookOutboundHasSecret,
					setWebhookInboundEnabled,
					setWebhookInboundEndpoint,
					setWebhookInboundHasSecret,
					setWebhookInboundScopes,
				);
			})
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
				markPasswordChanged();
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setChangingPassword(false);
			}
		},
		[confirmPassword, currentPassword, markPasswordChanged, newPassword, t],
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
				setSavedAdminEmail(response.data.email);
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
						const serverKey = toArrayBuffer(
							urlBase64ToUint8Array(publicVapidKey),
						);
						const newSubscription = await registration.pushManager.subscribe({
							userVisibleOnly: true,
							applicationServerKey: serverKey,
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
			if (enabled && adminEmail.trim().length === 0) {
				toaster.negative(
					t("settings.emailNotificationsRequiresAdminEmail"),
					{},
				);
				return;
			}

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
		[adminEmail, t],
	);

	const handleSaveWebhookSettings = useCallback(
		async (event: React.FormEvent) => {
			event.preventDefault();
			setSavingWebhook(true);
			try {
				const data = await api.setWebhookSettings({
					outbound: {
						enabled: webhookOutboundEnabled,
						url: webhookOutboundUrl,
						secret:
							webhookOutboundSecret.trim().length > 0
								? webhookOutboundSecret
								: undefined,
					},
					inbound: {
						enabled: webhookInboundEnabled,
						secret:
							webhookInboundSecret.trim().length > 0
								? webhookInboundSecret
								: undefined,
						scopes: webhookInboundScopes,
					},
				});
				applyWebhookSettings(
					data,
					setWebhookOutboundEnabled,
					setWebhookOutboundUrl,
					setWebhookOutboundHasSecret,
					setWebhookInboundEnabled,
					setWebhookInboundEndpoint,
					setWebhookInboundHasSecret,
					setWebhookInboundScopes,
				);
				setWebhookOutboundSecret("");
				setWebhookInboundSecret("");
				toaster.positive(t("settings.webhookSaved"), {});
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setSavingWebhook(false);
			}
		},
		[
			webhookInboundEnabled,
			webhookInboundScopes,
			webhookInboundSecret,
			webhookOutboundEnabled,
			webhookOutboundSecret,
			webhookOutboundUrl,
			t,
		],
	);

	const handleWebhookOutboundEnabledChange = useCallback(
		async (enabled: boolean) => {
			if (enabled) {
				setWebhookOutboundEnabled(true);
				return;
			}

			setSavingWebhook(true);
			try {
				const data = await api.setWebhookSettings({
					outbound: {
						enabled: false,
						url: webhookOutboundUrl,
					},
				});
				applyWebhookSettings(
					data,
					setWebhookOutboundEnabled,
					setWebhookOutboundUrl,
					setWebhookOutboundHasSecret,
					setWebhookInboundEnabled,
					setWebhookInboundEndpoint,
					setWebhookInboundHasSecret,
					setWebhookInboundScopes,
				);
				toaster.positive(t("settings.webhookSaved"), {});
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setSavingWebhook(false);
			}
		},
		[t, webhookOutboundUrl],
	);

	const handleWebhookInboundEnabledChange = useCallback(
		async (enabled: boolean) => {
			if (enabled) {
				setWebhookInboundEnabled(true);
				return;
			}

			setSavingWebhook(true);
			try {
				const data = await api.setWebhookSettings({
					inbound: {
						enabled: false,
						scopes: webhookInboundScopes,
					},
				});
				applyWebhookSettings(
					data,
					setWebhookOutboundEnabled,
					setWebhookOutboundUrl,
					setWebhookOutboundHasSecret,
					setWebhookInboundEnabled,
					setWebhookInboundEndpoint,
					setWebhookInboundHasSecret,
					setWebhookInboundScopes,
				);
				toaster.positive(t("settings.webhookSaved"), {});
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setSavingWebhook(false);
			}
		},
		[t, webhookInboundScopes],
	);

	const toggleWebhookInboundScope = useCallback((scope: string) => {
		setWebhookInboundScopes((currentScopes) =>
			currentScopes.includes(scope)
				? currentScopes.filter((currentScope) => currentScope !== scope)
				: [...currentScopes, scope],
		);
	}, []);

	const handleSendWebhookTest = useCallback(async () => {
		setTestingWebhook(true);
		try {
			await api.sendWebhookTest();
			toaster.positive(t("settings.webhookTestSent"), {});
		} catch (error: unknown) {
			toaster.negative(getErrorMessage(error, t("common.error")), {});
		} finally {
			setTestingWebhook(false);
		}
	}, [t]);

	return {
		adminEmail,
		savedAdminEmail,
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
		handleSaveWebhookSettings,
		handleSendWebhookTest,
		handleWebhookInboundEnabledChange,
		handleWebhookOutboundEnabledChange,
		isPasswordSectionOpen,
		mustChangePassword,
		newPassword,
		pushNotificationsEnabled,
		webhookInboundEnabled,
		webhookInboundEndpoint,
		webhookInboundHasSecret,
		webhookInboundScopes,
		webhookInboundSecret,
		webhookOutboundEnabled,
		webhookOutboundHasSecret,
		webhookOutboundSecret,
		webhookOutboundUrl,
		savingAdminEmail,
		savingCalendarSharing,
		savingEmailNotifications,
		savingLanguage,
		savingPushNotifications,
		savingWebhook,
		testingWebhook,
		loadingVersionInfo,
		setAdminEmail,
		setConfirmPassword,
		setCurrentPassword,
		setIsPasswordSectionOpen,
		setNewPassword,
		setWebhookInboundSecret,
		setWebhookOutboundSecret,
		setWebhookOutboundUrl,
		toggleWebhookInboundScope,
		versionInfo,
	};
}
