import { toaster } from "baseui/toast";
import { useCallback, useEffect, useState } from "react";
import {
	type ApiCalDAVHealthSnapshot,
	type ApiCalDAVQueueSnapshot,
	type ApiCalDAVRepairAction,
	type ApiCalDAVSettings,
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

function applyCalDAVSettings(
	settings: ApiCalDAVSettings,
	setCalDAVEnabled: (value: boolean) => void,
	setCalDAVBaseUrl: (value: string) => void,
	setCalDAVUsername: (value: string) => void,
	setCalDAVHasPassword: (value: boolean) => void,
	setCalDAVPassword: (value: string) => void,
	setCalDAVWritableCalendarUrl: (value: string) => void,
	setCalDAVCalendars: (value: ApiCalDAVSettings["calendars"]) => void,
	setCalDAVLastSyncAt: (value: string | null) => void,
	setCalDAVLastSyncStatus: (
		value: ApiCalDAVSettings["last_sync_status"],
	) => void,
	setCalDAVLastSyncError: (value: string | null) => void,
	setCalDAVHealth: (value: ApiCalDAVSettings["health"]) => void,
) {
	setCalDAVEnabled(settings.enabled);
	setCalDAVBaseUrl(settings.base_url);
	setCalDAVUsername(settings.username);
	setCalDAVHasPassword(settings.has_password);
	setCalDAVPassword("");
	setCalDAVWritableCalendarUrl(settings.writable_calendar_url);
	setCalDAVCalendars(settings.calendars);
	setCalDAVLastSyncAt(settings.last_sync_at);
	setCalDAVLastSyncStatus(settings.last_sync_status);
	setCalDAVLastSyncError(settings.last_sync_error);
	setCalDAVHealth(settings.health);
}

function applyCalDAVHealthSnapshot(
	snapshot: ApiCalDAVHealthSnapshot,
	setCalDAVLastSyncAt: (value: string | null) => void,
	setCalDAVLastSyncStatus: (
		value: ApiCalDAVSettings["last_sync_status"],
	) => void,
	setCalDAVLastSyncError: (value: string | null) => void,
	setCalDAVHealth: (value: ApiCalDAVSettings["health"]) => void,
) {
	setCalDAVLastSyncAt(snapshot.last_sync_at);
	setCalDAVLastSyncStatus(snapshot.last_sync_status);
	setCalDAVLastSyncError(snapshot.last_sync_error);
	setCalDAVHealth(snapshot.health);
}

const EMPTY_CALDAV_HEALTH: ApiCalDAVSettings["health"] = {
	failed_appointments_count: 0,
	retryable_appointments_count: 0,
	unsynced_approved_count: 0,
	error_breakdown: {
		auth: 0,
		network: 0,
		conflict: 0,
		validation: 0,
		calendar: 0,
		unknown: 0,
	},
	queue: {
		idle: 0,
		syncing: 0,
		retryable: 0,
		failed: 0,
		total: 0,
	},
	degraded_mode: {
		enabled: false,
		reason: null,
		threshold: 0,
		active_failed_count: 0,
	},
	background_sync_enabled: false,
	background_sync_interval_ms: 0,
	is_sync_running: false,
	last_background_sync_at: null,
	next_background_sync_at: null,
};

const EMPTY_CALDAV_QUEUE: ApiCalDAVQueueSnapshot = {
	summary: {
		idle: 0,
		syncing: 0,
		retryable: 0,
		failed: 0,
		total: 0,
	},
	items: [],
};

interface WebhookFormSnapshot {
	outboundEnabled: boolean;
	outboundUrl: string;
	inboundEnabled: boolean;
	inboundScopes: string[];
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
	if (left.length !== right.length) {
		return false;
	}

	return left.every((value, index) => value === right[index]);
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
	const [caldavEnabled, setCalDAVEnabled] = useState(false);
	const [caldavBaseUrl, setCalDAVBaseUrl] = useState("");
	const [caldavUsername, setCalDAVUsername] = useState("");
	const [caldavPassword, setCalDAVPassword] = useState("");
	const [caldavHasPassword, setCalDAVHasPassword] = useState(false);
	const [caldavWritableCalendarUrl, setCalDAVWritableCalendarUrl] =
		useState("");
	const [caldavCalendars, setCalDAVCalendars] = useState<
		ApiCalDAVSettings["calendars"]
	>([]);
	const [caldavLastSyncAt, setCalDAVLastSyncAt] = useState<string | null>(null);
	const [caldavLastSyncStatus, setCalDAVLastSyncStatus] =
		useState<ApiCalDAVSettings["last_sync_status"]>("idle");
	const [caldavLastSyncError, setCalDAVLastSyncError] = useState<string | null>(
		null,
	);
	const [caldavHealth, setCalDAVHealth] =
		useState<ApiCalDAVSettings["health"]>(EMPTY_CALDAV_HEALTH);
	const [caldavQueue, setCalDAVQueue] =
		useState<ApiCalDAVQueueSnapshot>(EMPTY_CALDAV_QUEUE);
	const [savingCalDAV, setSavingCalDAV] = useState(false);
	const [testingCalDAV, setTestingCalDAV] = useState(false);
	const [syncingCalDAV, setSyncingCalDAV] = useState(false);
	const [repairingCalDAVSlugId, setRepairingCalDAVSlugId] = useState<
		string | null
	>(null);
	const [repairingCalDAVAction, setRepairingCalDAVAction] =
		useState<ApiCalDAVRepairAction | null>(null);
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
	const [initialWebhookForm, setInitialWebhookForm] =
		useState<WebhookFormSnapshot | null>(null);
	const [webhookOutboundSecretDirty, setWebhookOutboundSecretDirty] =
		useState(false);
	const [webhookInboundSecretDirty, setWebhookInboundSecretDirty] =
		useState(false);
	const [revealingOutboundSecret, setRevealingOutboundSecret] = useState(false);
	const [revealingInboundSecret, setRevealingInboundSecret] = useState(false);
	const [savingWebhook, setSavingWebhook] = useState(false);
	const [testingWebhook, setTestingWebhook] = useState(false);
	const [versionInfo, setVersionInfo] = useState<ApiVersionInfo | null>(null);
	const [loadingVersionInfo, setLoadingVersionInfo] = useState(true);
	const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

	const captureWebhookSnapshot = useCallback(
		(settings: ApiWebhookSettings): WebhookFormSnapshot => ({
			outboundEnabled: settings.outbound.enabled,
			outboundUrl: settings.outbound.url,
			inboundEnabled: settings.inbound.enabled,
			inboundScopes: [...settings.inbound.scopes],
		}),
		[],
	);

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
		Promise.all([api.getCalDAVSettings(), api.getCalDAVQueue()])
			.then(([settings, queue]) => {
				applyCalDAVSettings(
					settings,
					setCalDAVEnabled,
					setCalDAVBaseUrl,
					setCalDAVUsername,
					setCalDAVHasPassword,
					setCalDAVPassword,
					setCalDAVWritableCalendarUrl,
					setCalDAVCalendars,
					setCalDAVLastSyncAt,
					setCalDAVLastSyncStatus,
					setCalDAVLastSyncError,
					setCalDAVHealth,
				);
				setCalDAVQueue(queue);
			})
			.catch(() => {});
	}, []);

	const refreshCalDAVHealth = useCallback(async () => {
		const snapshot = await api.getCalDAVHealth();
		applyCalDAVHealthSnapshot(
			snapshot,
			setCalDAVLastSyncAt,
			setCalDAVLastSyncStatus,
			setCalDAVLastSyncError,
			setCalDAVHealth,
		);
	}, []);

	const refreshCalDAVQueue = useCallback(async () => {
		const queue = await api.getCalDAVQueue();
		setCalDAVQueue(queue);
	}, []);

	const refreshCalDAVMonitoring = useCallback(async () => {
		await Promise.all([refreshCalDAVHealth(), refreshCalDAVQueue()]);
	}, [refreshCalDAVHealth, refreshCalDAVQueue]);

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			refreshCalDAVMonitoring().catch(() => {});
		}, 30000);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [refreshCalDAVMonitoring]);

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
				setWebhookOutboundSecret("");
				setWebhookInboundSecret("");
				setWebhookOutboundSecretDirty(false);
				setWebhookInboundSecretDirty(false);
				setInitialWebhookForm(captureWebhookSnapshot(settings));
			})
			.catch(() => {});
	}, [captureWebhookSnapshot]);

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

	const handleTestCalDAVConnection = useCallback(async () => {
		setTestingCalDAV(true);
		try {
			const data = await api.testCalDAVConnection({
				base_url: caldavBaseUrl,
				username: caldavUsername,
				password: caldavPassword.trim().length > 0 ? caldavPassword : undefined,
			});
			setCalDAVCalendars(data.calendars);
			toaster.positive(t("settings.caldavConnectionSuccess"), {});
		} catch (error: unknown) {
			toaster.negative(getErrorMessage(error, t("common.error")), {});
		} finally {
			setTestingCalDAV(false);
		}
	}, [caldavBaseUrl, caldavPassword, caldavUsername, t]);

	const handleSaveCalDAVSettings = useCallback(
		async (event: React.FormEvent) => {
			event.preventDefault();
			setSavingCalDAV(true);
			try {
				const settings = await api.setCalDAVSettings({
					enabled: caldavEnabled,
					base_url: caldavBaseUrl,
					username: caldavUsername,
					password:
						caldavPassword.trim().length > 0 ? caldavPassword : undefined,
					writable_calendar_url: caldavWritableCalendarUrl,
				});
				applyCalDAVSettings(
					settings,
					setCalDAVEnabled,
					setCalDAVBaseUrl,
					setCalDAVUsername,
					setCalDAVHasPassword,
					setCalDAVPassword,
					setCalDAVWritableCalendarUrl,
					setCalDAVCalendars,
					setCalDAVLastSyncAt,
					setCalDAVLastSyncStatus,
					setCalDAVLastSyncError,
					setCalDAVHealth,
				);
				toaster.positive(t("settings.caldavSaved"), {});
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setSavingCalDAV(false);
			}
		},
		[
			caldavBaseUrl,
			caldavEnabled,
			caldavPassword,
			caldavUsername,
			caldavWritableCalendarUrl,
			t,
		],
	);

	const handleRetryCalDAVSync = useCallback(async () => {
		setSyncingCalDAV(true);
		try {
			const data = await api.triggerCalDAVSync();
			applyCalDAVHealthSnapshot(
				data.snapshot,
				setCalDAVLastSyncAt,
				setCalDAVLastSyncStatus,
				setCalDAVLastSyncError,
				setCalDAVHealth,
			);
			await refreshCalDAVQueue();
			if (data.result.processed_count === 0) {
				toaster.positive(t("settings.caldavRetryNoop"), {});
			} else {
				toaster.positive(
					`${t("settings.caldavRetryCompleted")} ${data.result.success_count}/${data.result.processed_count}`,
					{},
				);
			}
		} catch (error: unknown) {
			toaster.negative(getErrorMessage(error, t("common.error")), {});
		} finally {
			setSyncingCalDAV(false);
		}
	}, [refreshCalDAVQueue, t]);

	const handleRepairCalDAVQueueItem = useCallback(
		async (slugId: string, action: ApiCalDAVRepairAction) => {
			setRepairingCalDAVSlugId(slugId);
			setRepairingCalDAVAction(action);
			try {
				const data = await api.repairCalDAVQueueItem(slugId, action);
				await refreshCalDAVMonitoring();
				if (data.blocked_by_policy) {
					toaster.negative(t("settings.caldavRepairBlockedByPolicy"), {});
					return;
				}

				toaster.positive(t(`settings.caldavRepairAction.${action}`), {});
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setRepairingCalDAVSlugId(null);
				setRepairingCalDAVAction(null);
			}
		},
		[refreshCalDAVMonitoring, t],
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
				setWebhookOutboundSecretDirty(false);
				setWebhookInboundSecretDirty(false);
				setInitialWebhookForm(captureWebhookSnapshot(data));
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
			captureWebhookSnapshot,
			t,
		],
	);

	const handleWebhookOutboundEnabledChange = useCallback((enabled: boolean) => {
		setWebhookOutboundEnabled(enabled);
	}, []);

	const handleWebhookInboundEnabledChange = useCallback((enabled: boolean) => {
		setWebhookInboundEnabled(enabled);
	}, []);

	const handleWebhookOutboundSecretChange = useCallback((value: string) => {
		setWebhookOutboundSecret(value);
		setWebhookOutboundSecretDirty(true);
	}, []);

	const handleWebhookInboundSecretChange = useCallback((value: string) => {
		setWebhookInboundSecret(value);
		setWebhookInboundSecretDirty(true);
	}, []);

	const handleRevealWebhookSecret = useCallback(
		async (target: "outbound" | "inbound") => {
			const setLoading =
				target === "outbound"
					? setRevealingOutboundSecret
					: setRevealingInboundSecret;
			const setSecret =
				target === "outbound"
					? setWebhookOutboundSecret
					: setWebhookInboundSecret;

			setLoading(true);
			try {
				const secret = await api.getWebhookSecret(target);
				setSecret(secret);
			} catch (error: unknown) {
				toaster.negative(getErrorMessage(error, t("common.error")), {});
			} finally {
				setLoading(false);
			}
		},
		[t],
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

	const isWebhookDirty =
		initialWebhookForm === null
			? false
			: initialWebhookForm.outboundEnabled !== webhookOutboundEnabled ||
				initialWebhookForm.outboundUrl !== webhookOutboundUrl ||
				initialWebhookForm.inboundEnabled !== webhookInboundEnabled ||
				!areStringArraysEqual(
					initialWebhookForm.inboundScopes,
					webhookInboundScopes,
				) ||
				webhookOutboundSecretDirty ||
				webhookInboundSecretDirty;

	return {
		adminEmail,
		savedAdminEmail,
		calendarSharingEnabled,
		caldavBaseUrl,
		caldavCalendars,
		caldavEnabled,
		caldavHasPassword,
		caldavLastSyncAt,
		caldavHealth,
		caldavQueue,
		caldavLastSyncError,
		caldavLastSyncStatus,
		caldavPassword,
		caldavUsername,
		caldavWritableCalendarUrl,
		changingPassword,
		confirmPassword,
		currentPassword,
		emailNotificationsEnabled,
		handleChangePassword,
		handleLanguageChange,
		handleSaveCalDAVSettings,
		handleRepairCalDAVQueueItem,
		handleRetryCalDAVSync,
		handleSaveAdminEmail,
		handleToggleCalendarSharing,
		handleToggleEmailNotifications,
		handleTogglePushNotifications,
		handleTestCalDAVConnection,
		handleSaveWebhookSettings,
		handleSendWebhookTest,
		handleWebhookInboundEnabledChange,
		handleWebhookInboundSecretChange,
		handleWebhookOutboundEnabledChange,
		handleWebhookOutboundSecretChange,
		handleRevealWebhookSecret,
		isPasswordSectionOpen,
		isWebhookDirty,
		mustChangePassword,
		newPassword,
		pushNotificationsEnabled,
		repairingCalDAVAction,
		repairingCalDAVSlugId,
		revealingInboundSecret,
		revealingOutboundSecret,
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
		savingCalDAV,
		savingCalendarSharing,
		savingEmailNotifications,
		savingLanguage,
		savingPushNotifications,
		savingWebhook,
		setCalDAVBaseUrl,
		setCalDAVEnabled,
		setCalDAVPassword,
		setCalDAVUsername,
		setCalDAVWritableCalendarUrl,
		syncingCalDAV,
		testingWebhook,
		testingCalDAV,
		loadingVersionInfo,
		setAdminEmail,
		setConfirmPassword,
		setCurrentPassword,
		setIsPasswordSectionOpen,
		setNewPassword,
		setWebhookOutboundUrl,
		toggleWebhookInboundScope,
		versionInfo,
	};
}

export type SettingsPageState = ReturnType<typeof useSettingsPage>;
