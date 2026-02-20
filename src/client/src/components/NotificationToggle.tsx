import { useStyletron } from "baseui";
import { Button, KIND, SIZE } from "baseui/button";
import { Bell, BellOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useI18n } from "../context/I18nContext";

export function NotificationToggle({ isExpanded }: { isExpanded: boolean }) {
	const [css] = useStyletron();
	const { t } = useI18n();
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [loading, setLoading] = useState(false);

	const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

	const getServiceWorkerRegistration = useCallback(async () => {
		if (!("serviceWorker" in navigator)) {
			throw new Error("Service worker is not supported");
		}

		const existingRegistration =
			await navigator.serviceWorker.getRegistration();
		if (existingRegistration) {
			return existingRegistration;
		}

		const readyOrTimeout = await Promise.race([
			navigator.serviceWorker.ready,
			new Promise<null>((resolve) => {
				setTimeout(() => resolve(null), 6000);
			}),
		]);

		if (readyOrTimeout) {
			return readyOrTimeout;
		}

		throw new Error("Service worker registration timed out");
	}, []);

	const checkSubscription = useCallback(async () => {
		if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
			setIsSubscribed(false);
			return;
		}

		try {
			const registration = await getServiceWorkerRegistration();
			const subscription = await registration.pushManager.getSubscription();
			setIsSubscribed(!!subscription);
		} catch (e) {
			console.error("Error checking subscription", e);
			setIsSubscribed(false);
		}
	}, [getServiceWorkerRegistration]);

	useEffect(() => {
		if (!publicKey) return;
		checkSubscription();
	}, [checkSubscription]);

	function urlBase64ToUint8Array(base64String: string) {
		const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding)
			.replace(/-/g, "+")
			.replace(/_/g, "/");
		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	async function subscribe() {
		if (!publicKey || loading || isSubscribed) return;

		setLoading(true);
		try {
			if (!("Notification" in window)) {
				throw new Error("Notifications are not supported");
			}

			if (!("PushManager" in window)) {
				throw new Error("Push API is not supported");
			}

			if (Notification.permission === "granted") {
				const registration = await getServiceWorkerRegistration();
				const existingSubscription =
					await registration.pushManager.getSubscription();

				if (existingSubscription) {
					await api.subscribeToPush(existingSubscription);
					setIsSubscribed(true);
					return;
				}
			}

			const permission = await Notification.requestPermission();
			if (permission !== "granted") {
				throw new Error("Permission denied");
			}

			const registration = await getServiceWorkerRegistration();
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKey),
			});

			await api.subscribeToPush(subscription);

			setIsSubscribed(true);
		} catch (err) {
			console.error("Subscription failed", err);
		} finally {
			setLoading(false);
		}
	}

	if (!publicKey) return null;

	return (
		<Button
			kind={isSubscribed ? KIND.secondary : KIND.secondary}
			size={SIZE.compact}
			isLoading={loading}
			onClick={subscribe}
			disabled={isSubscribed}
			overrides={{
				BaseButton: {
					style: {
						width: "100%",
						justifyContent: "flex-start",
						paddingLeft: "12px",
						paddingRight: "12px",
						flexShrink: 0,
						"@media (max-width: 768px)": {
							justifyContent: isExpanded ? "flex-start" : "center",
							paddingLeft: isExpanded ? "12px" : "0",
							paddingRight: isExpanded ? "12px" : "0",
						},
					},
				},
			}}
		>
			{isSubscribed ? <Bell size={20} /> : <BellOff size={20} />}
			<span
				className={css({
					marginLeft: "12px",
					"@media (max-width: 768px)": {
						display: isExpanded ? "block" : "none",
					},
				})}
			>
				{isSubscribed ? t("nav.notificationsOn") : t("nav.enableNotifications")}
			</span>
		</Button>
	);
}
