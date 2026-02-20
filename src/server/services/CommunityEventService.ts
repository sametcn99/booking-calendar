import { t } from "../i18n";
import { MailService } from "../mail/MailService";
import { CommunityEventRepository } from "../repositories/CommunityEventRepository";
import { SettingsRepository } from "../repositories/SettingsRepository";
import { generateUniqueSlugId } from "../utils/slug";
import { PushService } from "./PushService";
import { WebhookService } from "./WebhookService";

export class CommunityEventService {
	private repo = new CommunityEventRepository();
	private mailService = new MailService();
	private pushService = new PushService();
	private webhookService = new WebhookService();
	private settingsRepo = new SettingsRepository();

	private parseApproverEmails(raw: string): string[] {
		try {
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) return [];
			return parsed
				.filter((email): email is string => typeof email === "string")
				.map((email) => email.trim().toLowerCase())
				.filter((email) => email.length > 0);
		} catch {
			return [];
		}
	}

	private async isPushEnabled(): Promise<boolean> {
		const value = await this.settingsRepo.get("push_notifications_enabled");
		return value === "true";
	}

	private async isEmailEnabled(): Promise<boolean> {
		const value = await this.settingsRepo.get("email_notifications_enabled");
		return value === "true";
	}

	private async notifyEventActive(eventId: number): Promise<void> {
		const latest = await this.repo.findById(eventId);
		if (!latest) return;

		const emailEnabled = await this.isEmailEnabled();
		if (emailEnabled) {
			this.mailService
				.sendCommunityEventActivated(
					latest,
					this.parseApproverEmails(latest.approver_emails_json),
				)
				.catch((err) =>
					console.error("Failed to send community event active emails:", err),
				);
		}

		const pushEnabled = await this.isPushEnabled();
		if (pushEnabled) {
			this.pushService
				.sendToAll({
					title: t("push.communityEventActivatedTitle"),
					body: `${t("push.communityEventActivatedBody")} ${latest.title}`,
					url: "/admin/events",
				})
				.catch((err) =>
					console.error("Failed to send community event active push:", err),
				);
		}
	}

	private async notifyEventCanceled(eventId: number): Promise<void> {
		const latest = await this.repo.findById(eventId);
		if (!latest) return;

		const emailEnabled = await this.isEmailEnabled();
		if (emailEnabled) {
			this.mailService
				.sendCommunityEventCanceled(
					latest,
					this.parseApproverEmails(latest.approver_emails_json),
				)
				.catch((err) =>
					console.error("Failed to send community event canceled emails:", err),
				);
		}

		const pushEnabled = await this.isPushEnabled();
		if (pushEnabled) {
			this.pushService
				.sendToAll({
					title: t("push.communityEventCanceledTitle"),
					body: `${t("push.communityEventCanceledBody")} ${latest.title}`,
					url: "/admin/events",
				})
				.catch((err) =>
					console.error("Failed to send community event canceled push:", err),
				);
		}
	}

	private async notifyApprovalReceived(
		eventId: number,
		eventSlugId: string,
		eventTitle: string,
		approvedBy: string,
		currentApprovals: number,
		requiredApprovals: number,
	): Promise<void> {
		this.webhookService
			.sendEvent("community_event.approval_received", {
				event_id: eventId,
				event_slug_id: eventSlugId,
				event_title: eventTitle,
				approved_by: approvedBy,
				current_approvals: currentApprovals,
				required_approvals: requiredApprovals,
				admin_url: "/admin/events",
			})
			.catch((err) =>
				console.error("Failed to send community event approval webhook:", err),
			);

		const pushEnabled = await this.isPushEnabled();
		if (!pushEnabled) {
			return;
		}

		this.pushService
			.sendToAll({
				title: t("push.communityEventApprovalTitle"),
				body: `${t("push.communityEventApprovalBody")} ${eventTitle} (${currentApprovals}/${requiredApprovals}) - ${approvedBy}`,
				url: "/admin/events",
			})
			.catch((err) =>
				console.error("Failed to send community event approval push:", err),
			);
	}

	async getAllEvents() {
		return this.repo.findAll();
	}

	async createEvent(input: {
		title?: string;
		description?: string;
		start_at?: string;
		end_at?: string;
		color?: string;
		required_approvals?: number;
	}) {
		if (!input.title || !input.start_at || !input.end_at) {
			throw new Error(t("communityEvent.fieldsRequired"));
		}

		const start = new Date(input.start_at);
		const end = new Date(input.end_at);

		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
			throw new Error(t("slot.invalidDate"));
		}

		if (end <= start) {
			throw new Error(t("slot.endAfterStart"));
		}

		if (start <= new Date()) {
			throw new Error(t("communityEvent.mustBeFuture"));
		}

		const requiredApprovals = input.required_approvals ?? 3;
		if (requiredApprovals < 1) {
			throw new Error(t("communityEvent.minApprovals"));
		}

		const slugId = await generateUniqueSlugId(async (candidate) => {
			const existing = await this.repo.findBySlugId(candidate);
			return Boolean(existing);
		});

		return this.repo.create({
			title: input.title,
			description: input.description,
			start_at: input.start_at,
			end_at: input.end_at,
			color: input.color,
			required_approvals: requiredApprovals,
			slug_id: slugId,
		});
	}

	async getBySlugId(slugId: string) {
		const event = await this.repo.findBySlugId(slugId);
		if (!event) {
			throw new Error(t("communityEvent.notFound"));
		}
		return event;
	}

	async approve(slugId: string, input: { full_name?: string; email?: string }) {
		const event = await this.repo.findBySlugId(slugId);
		if (!event) {
			throw new Error(t("communityEvent.notFound"));
		}
		if (event.status === "canceled") {
			throw new Error(t("communityEvent.alreadyCanceled"));
		}
		if (event.status === "active") {
			throw new Error(t("communityEvent.alreadyActive"));
		}

		const normalizedName = input.full_name?.trim();
		if (!normalizedName) {
			throw new Error(t("communityEvent.fullNameRequired"));
		}

		if (normalizedName.length < 3 || !normalizedName.includes(" ")) {
			throw new Error(t("communityEvent.fullNameInvalid"));
		}

		const normalizedEmail = input.email?.trim().toLowerCase();
		if (normalizedEmail) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(normalizedEmail)) {
				throw new Error(t("general.invalidEmail"));
			}
		}

		const existingApprovals = (() => {
			try {
				const parsed = JSON.parse(event.approvals_json);
				if (!Array.isArray(parsed)) return [];
				return parsed.filter(
					(value): value is { full_name: string; email?: string } =>
						typeof value === "object" &&
						value !== null &&
						typeof (value as Record<string, unknown>).full_name === "string",
				);
			} catch {
				return [];
			}
		})();

		const hasName = existingApprovals.some(
			(value) =>
				value.full_name.trim().toLowerCase() === normalizedName.toLowerCase(),
		);
		if (hasName) {
			throw new Error(t("communityEvent.fullNameAlreadyApproved"));
		}

		if (
			normalizedEmail &&
			existingApprovals.some((value) => value.email === normalizedEmail)
		) {
			throw new Error(t("communityEvent.emailAlreadyApproved"));
		}

		const wasPending = event.status === "pending";
		const updated = await this.repo.incrementApproval(event.id, {
			full_name: normalizedName,
			email: normalizedEmail,
		});
		if (!updated) {
			throw new Error(t("communityEvent.notFound"));
		}

		await this.notifyApprovalReceived(
			updated.id,
			updated.slug_id,
			updated.title,
			normalizedName,
			updated.current_approvals,
			updated.required_approvals,
		);

		if (wasPending && updated.status === "active") {
			await this.notifyEventActive(updated.id);
		}

		return updated;
	}

	async deleteEventBySlugId(slugId: string) {
		const event = await this.repo.findBySlugId(slugId);
		if (!event) {
			throw new Error(t("communityEvent.notFound"));
		}
		if (event.status !== "canceled") {
			await this.repo.updateStatus(event.id, "canceled");
			await this.notifyEventCanceled(event.id);
		}
		await this.repo.deleteBySlugId(slugId);
	}

	async cancelExpiredPending() {
		const expired = await this.repo.findExpiredPending();
		for (const event of expired) {
			await this.repo.updateStatus(event.id, "canceled");
			await this.notifyEventCanceled(event.id);
		}
		return expired.length;
	}
}
