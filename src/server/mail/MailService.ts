import { join } from "node:path";
import Handlebars from "handlebars";
import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { config } from "../config";
import { t } from "../i18n";
import { SettingsRepository } from "../repositories/SettingsRepository";
import type { AppointmentWithSlot } from "../types";
import { generateICS } from "./ics";

export class MailService {
	private transporter: Transporter;
	private settingsRepo: SettingsRepository;
	private templateCache: Map<string, Handlebars.TemplateDelegate>;

	constructor() {
		this.settingsRepo = new SettingsRepository();
		this.templateCache = new Map();
		this.transporter = nodemailer.createTransport({
			host: config.smtp.host,
			port: config.smtp.port,
			secure: config.smtp.secure,
			auth: {
				user: config.smtp.user,
				pass: config.smtp.pass,
			},
		});
	}

	private async getAdminEmail(): Promise<string> {
		const savedEmail = (await this.settingsRepo.get("admin_email"))?.trim();
		return savedEmail ?? "";
	}

	private async isMailServiceEnabled(): Promise<boolean> {
		const adminEmail = await this.getAdminEmail();
		return adminEmail.length > 0;
	}

	private async renderTemplate(
		templateName: string,
		context: Record<string, unknown>,
	): Promise<string> {
		let template = this.templateCache.get(templateName);

		if (!template) {
			const templatePath = join(
				import.meta.dir,
				"templates",
				`${templateName}.hbs`,
			);
			const source = await Bun.file(templatePath).text();
			template = Handlebars.compile(source);
			this.templateCache.set(templateName, template);
		}

		const commonContext = {
			currentYear: new Date().getFullYear(),
		};

		return template({ ...commonContext, ...context });
	}

	async sendBookingConfirmation(
		appointment: AppointmentWithSlot,
	): Promise<void> {
		if (!appointment.email) return;
		if (!(await this.isMailServiceEnabled())) return;

		const startDate = new Date(appointment.start_at);
		const endDate = new Date(appointment.end_at);
		const icsContent = generateICS(appointment);
		const cancelUrl = appointment.cancel_token
			? `${config.baseUrl}/api/public/appointments/cancel/${appointment.cancel_token}`
			: null;

		const html = await this.renderTemplate("booking-confirmation", {
			t: {
				title: t("mail.confirmation.title"),
				greeting: t("mail.confirmation.greeting"),
				message: t("mail.confirmation.message"),
				startTime: t("mail.confirmation.startTime"),
				endTime: t("mail.confirmation.endTime"),
				meetingPlace: t("mail.confirmation.meetingPlace"),
				note: t("mail.confirmation.note"),
				cancelBtn: t("mail.confirmation.cancelBtn"),
			},
			name: appointment.name,
			start: startDate.toLocaleString(),
			end: endDate.toLocaleString(),
			meetingPlace: appointment.meeting_place ?? undefined,
			note: appointment.note ?? undefined,
			cancelUrl: cancelUrl ?? undefined,
		});

		await this.transporter.sendMail({
			from: config.smtp.from,
			to: appointment.email,
			subject: t("mail.confirmation.subject"),
			html,
			icalEvent: {
				filename: "appointment.ics",
				method: "REQUEST",
				content: icsContent,
			},
		});
	}

	async sendAdminNotification(appointment: AppointmentWithSlot): Promise<void> {
		const adminEmail = await this.getAdminEmail();
		if (!adminEmail) return;

		const startDate = new Date(appointment.start_at);
		const endDate = new Date(appointment.end_at);
		const icsContent = generateICS(appointment);
		const cancelUrl = appointment.cancel_token
			? `${config.baseUrl}/api/public/appointments/cancel/${appointment.cancel_token}`
			: null;

		const html = await this.renderTemplate("admin-notification", {
			t: {
				title: t("mail.adminNotification.title"),
				message: t("mail.adminNotification.message"),
				clientName: t("mail.adminNotification.clientName"),
				clientEmail: t("mail.adminNotification.clientEmail"),
				startTime: t("mail.adminNotification.startTime"),
				endTime: t("mail.adminNotification.endTime"),
				meetingPlace: t("mail.adminNotification.meetingPlace"),
				note: t("mail.adminNotification.note"),
				cancelBtn: t("mail.adminNotification.cancelBtn"),
			},
			name: appointment.name,
			emailDisplay: appointment.email ?? "Not provided",
			start: startDate.toLocaleString(),
			end: endDate.toLocaleString(),
			meetingPlace: appointment.meeting_place ?? undefined,
			note: appointment.note ?? undefined,
			cancelUrl: cancelUrl ?? undefined,
		});

		await this.transporter.sendMail({
			from: config.smtp.from,
			to: adminEmail,
			subject: `${t("mail.adminNotification.subject")}: ${appointment.name}`,
			html,
			icalEvent: {
				filename: "appointment.ics",
				method: "REQUEST",
				content: icsContent,
			},
		});
	}

	async sendCancellationNotifications(
		appointment: AppointmentWithSlot,
	): Promise<void> {
		if (!(await this.isMailServiceEnabled())) return;

		const adminEmail = await this.getAdminEmail();
		const startDate = new Date(appointment.start_at);
		const endDate = new Date(appointment.end_at);
		const baseHtml = await this.renderTemplate("cancellation-notification", {
			t: {
				title: t("mail.cancellation.title"),
				message: t("mail.cancellation.message"),
				clientName: t("mail.cancellation.clientName"),
				clientEmail: t("mail.cancellation.clientEmail"),
				startTime: t("mail.cancellation.startTime"),
				endTime: t("mail.cancellation.endTime"),
				meetingPlace: t("mail.cancellation.meetingPlace"),
				note: t("mail.cancellation.note"),
			},
			canceledBy:
				appointment.canceled_by === "admin"
					? t("mail.cancellation.canceledByAdmin")
					: t("mail.cancellation.canceledByUser"),
			name: appointment.name,
			emailDisplay: appointment.email ?? "Not provided",
			start: startDate.toLocaleString(),
			end: endDate.toLocaleString(),
			meetingPlace: appointment.meeting_place ?? undefined,
			note: appointment.note ?? undefined,
		});

		const tasks: Promise<unknown>[] = [];

		if (appointment.email) {
			tasks.push(
				this.transporter.sendMail({
					from: config.smtp.from,
					to: appointment.email,
					subject: t("mail.cancellation.subject"),
					html: baseHtml,
				}),
			);
		}

		if (adminEmail) {
			tasks.push(
				this.transporter.sendMail({
					from: config.smtp.from,
					to: adminEmail,
					subject: `${t("mail.cancellation.subject")}: ${appointment.name}`,
					html: baseHtml,
				}),
			);
		}

		await Promise.all(tasks);
	}
}
