import webpush from "web-push";
import { config } from "../config";
import { AppDataSource } from "../db/data-source";
import { PushSubscriptionEntity } from "../entities/PushSubscriptionEntity";
import { t } from "../i18n";
import { WebhookService } from "./WebhookService";

export class PushService {
	private isConfigured = false;
	private webhookService = new WebhookService();

	constructor() {
		if (config.vapid?.publicKey && config.vapid.privateKey) {
			webpush.setVapidDetails(
				`mailto:${config.vapid.email}`,
				config.vapid.publicKey,
				config.vapid.privateKey,
			);
			this.isConfigured = true;
		} else {
			console.warn(t("push.vapidNotConfigured"));
		}
	}

	private getRepo() {
		return AppDataSource.getRepository(PushSubscriptionEntity);
	}

	async subscribe(
		subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
		userAgent?: string,
	): Promise<void> {
		if (!subscription || !subscription.endpoint || !subscription.keys) {
			throw new Error(t("push.invalidSubscription"));
		}

		const repo = this.getRepo();
		const existing = await repo.findOneBy({
			endpoint: subscription.endpoint,
		});

		if (existing) {
			return;
		}

		console.log("Saving new subscription", subscription.endpoint);

		const sub = new PushSubscriptionEntity();
		sub.endpoint = subscription.endpoint;
		sub.p256dh = subscription.keys.p256dh;
		sub.auth = subscription.keys.auth;
		sub.user_agent = userAgent || null;

		await repo.save(sub);
	}

	async sendToAll(payload: {
		title: string;
		body: string;
		url?: string;
		tag?: string;
	}): Promise<void> {
		const repo = this.getRepo();
		const subscriptions = this.isConfigured ? await repo.find() : [];

		let deliveredCount = 0;
		let failedCount = 0;

		if (subscriptions.length > 0) {
			const payloadString = JSON.stringify(payload);
			console.log(
				`Sending push notification to ${subscriptions.length} clients`,
			);

			const promises = subscriptions.map(async (sub) => {
				const pushSub = {
					endpoint: sub.endpoint,
					keys: {
						p256dh: sub.p256dh,
						auth: sub.auth,
					},
				};

				try {
					await webpush.sendNotification(pushSub, payloadString);
					deliveredCount += 1;
				} catch (error) {
					failedCount += 1;
					const err = error as { statusCode?: number; message?: string };
					console.error(
						`Error sending push to ${sub.endpoint}: ${err.statusCode} ${err.message}`,
					);
					if (err.statusCode === 410 || err.statusCode === 404) {
						await repo.remove(sub);
					}
				}
			});

			await Promise.all(promises);
		}

		try {
			await this.webhookService.sendEvent("push.notification", {
				notification: payload,
				metrics: {
					push_configured: this.isConfigured,
					targeted_subscriptions: subscriptions.length,
					delivered: deliveredCount,
					failed: failedCount,
				},
			});
		} catch (error) {
			console.error("Failed to mirror push notification to webhook:", error);
		}
	}
}
