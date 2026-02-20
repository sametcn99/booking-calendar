import { t } from "../i18n";
import { PushService } from "../services/PushService";

export class PushController {
	private pushService: PushService;

	constructor() {
		this.pushService = new PushService();
	}

	async subscribe(
		body: {
			subscription: {
				endpoint: string;
				keys: { p256dh: string; auth: string };
			};
		},
		userAgent?: string,
	): Promise<{ status: number; body: { success: boolean; error?: string } }> {
		if (!body.subscription) {
			return {
				status: 400,
				body: { success: false, error: t("general.invalidRequest") },
			};
		}

		try {
			await this.pushService.subscribe(body.subscription, userAgent);
			return { status: 200, body: { success: true } };
		} catch (error) {
			console.error("Subscription error:", error);
			return {
				status: 400,
				body: { success: false, error: t("general.invalidRequest") },
			};
		}
	}
}
