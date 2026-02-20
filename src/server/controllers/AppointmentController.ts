import { t } from "../i18n";
import { AppointmentService } from "../services/AppointmentService";
import type { ApiResponse } from "../types";

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return t("error.unexpected");
}

export class AppointmentController {
	private appointmentService: AppointmentService;

	constructor() {
		this.appointmentService = new AppointmentService();
	}

	async getAllAppointments(): Promise<{ status: number; body: ApiResponse }> {
		const appointments = await this.appointmentService.getAllAppointments();
		return { status: 200, body: { success: true, data: appointments } };
	}

	async getAppointmentByToken(
		token: string,
	): Promise<{ status: number; body: ApiResponse }> {
		try {
			const appointment =
				await this.appointmentService.getAppointmentByToken(token);
			return { status: 200, body: { success: true, data: appointment } };
		} catch (err: unknown) {
			const message = getErrorMessage(err);
			return {
				status: 404,
				body: { success: false, error: message },
			};
		}
	}

	async createAppointment(
		token: string,
		body: {
			slot_id?: number;
			name?: string;
			email?: string;
			meeting_place?: string;
			note?: string;
			start_at?: string;
			end_at?: string;
		},
	): Promise<{ status: number; body: ApiResponse }> {
		if (!body.slot_id || !body.name || !body.start_at || !body.end_at) {
			return {
				status: 400,
				body: {
					success: false,
					error: t("appointment.fieldsRequired"),
				},
			};
		}

		// Basic email validation for optional email field
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (body.email && !emailRegex.test(body.email)) {
			return {
				status: 400,
				body: { success: false, error: t("appointment.invalidEmail") },
			};
		}

		try {
			const appointment = await this.appointmentService.createAppointment(
				token,
				{
					slot_id: body.slot_id,
					name: body.name,
					email: body.email,
					meeting_place: body.meeting_place,
					note: body.note,
					start_at: body.start_at,
					end_at: body.end_at,
				},
			);
			return { status: 201, body: { success: true, data: appointment } };
		} catch (err: unknown) {
			const message = getErrorMessage(err);
			const status =
				message.includes("already booked") || message.includes("overlaps")
					? 409
					: 400;
			return {
				status,
				body: { success: false, error: message },
			};
		}
	}

	async deleteAppointment(
		id: number,
	): Promise<{ status: number; body: ApiResponse }> {
		try {
			await this.appointmentService.deleteAppointment(id);
			return { status: 200, body: { success: true } };
		} catch (err: unknown) {
			const message = getErrorMessage(err);
			const status = message === t("appointment.notFound") ? 404 : 400;
			return {
				status,
				body: { success: false, error: message },
			};
		}
	}

	async cancelAppointment(
		id: number,
	): Promise<{ status: number; body: ApiResponse }> {
		try {
			const appointment =
				await this.appointmentService.cancelAppointmentById(id);
			return { status: 200, body: { success: true, data: appointment } };
		} catch (err: unknown) {
			const message = getErrorMessage(err);
			const status = message.includes("already canceled") ? 409 : 404;
			return {
				status,
				body: { success: false, error: message },
			};
		}
	}

	async cancelAppointmentByToken(
		token: string,
	): Promise<{ status: number; body: ApiResponse }> {
		try {
			const appointment =
				await this.appointmentService.cancelAppointmentByToken(token);
			return { status: 200, body: { success: true, data: appointment } };
		} catch (err: unknown) {
			const message = getErrorMessage(err);
			const status =
				message.includes("already canceled") ||
				message.includes("Invalid cancellation link")
					? 409
					: 400;
			return {
				status,
				body: { success: false, error: message },
			};
		}
	}
}
