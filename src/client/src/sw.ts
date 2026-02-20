/// <reference lib="webworker" />
import {
	cleanupOutdatedCaches,
	createHandlerBoundToURL,
	getCacheKeyForURL,
	precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;

// Clean up old caches
cleanupOutdatedCaches();

// Precache resources
precacheAndRoute(self.__WB_MANIFEST);

// SPA navigation fallback
if (getCacheKeyForURL("/index.html")) {
	registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html")));
}

// API Caching Strategy (moved from vite.config.ts)
registerRoute(
	/^https?:\/\/.*\/api\/admin\/.*/i,
	new NetworkFirst({
		cacheName: "admin-api-cache",
		plugins: [
			{
				cacheWillUpdate: async ({ response }) => {
					if (response && response.status === 200) {
						return response;
					}
					return null;
				},
			},
		],
	}),
);

// Push Notification Handler
self.addEventListener("push", (event) => {
	if (event.data) {
		try {
			const payload = JSON.parse(event.data.text());
			const options: NotificationOptions = {
				body: payload.body,
				icon: "/android-chrome-192x192.png",
				badge: "/favicon-32x32.png",
				data: { url: payload.url },
				tag: payload.tag || "default", // prevent duplicates if needed
				requireInteraction: true,
			};

			event.waitUntil(
				self.registration.showNotification(payload.title, options),
			);
		} catch (e) {
			console.error("Error handling push event:", e);
		}
	}
});

// Notification Click Handler
self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	if (event.action === "close") return;

	event.waitUntil(
		self.clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((clientList) => {
				const urlToOpen = event.notification.data?.url || "/admin/appointments";

				// Check if there's already a tab open
				for (const client of clientList) {
					if (client.url.includes(urlToOpen) && "focus" in client) {
						return client.focus();
					}
				}

				// If not, open a new window
				if (self.clients.openWindow) {
					return self.clients.openWindow(urlToOpen);
				}
			}),
	);
});
