export interface AvailabilitySlot {
	id: number;
	name: string | null;
	start_at: string;
	end_at: string;
	is_active: number;
	created_at: string;
}

export interface BusyInterval {
	start_at: string;
	end_at: string;
}

export interface PublicAvailabilitySlot extends AvailabilitySlot {
	busy_intervals: BusyInterval[];
}

export interface BookingLink {
	id: number;
	name: string;
	slug_id: string;
	allowed_slot_ids: number[];
	expires_at: string;
	created_at: string;
}

export interface Appointment {
	id: number;
	slot_id: number;
	name: string;
	email: string | null;
	meeting_place: string | null;
	note: string | null;
	start_at: string;
	end_at: string;
	slug_id: string | null;
	canceled_at: string | null;
	canceled_by: string | null;
	created_at: string;
}

export interface AppointmentWithSlot extends Appointment {}

export interface CreateSlotInput {
	name: string;
	start_at: string;
	end_at: string;
}

export interface CreateAppointmentInput {
	slot_id: number;
	name: string;
	email?: string;
	meeting_place?: string;
	note?: string;
	start_at: string;
	end_at: string;
}

export interface CreateBookingLinkInput {
	name: string;
	slug_id: string;
	allowed_slot_ids: number[];
	expires_at: string;
}

export interface LoginInput {
	username: string;
	password: string;
}

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}
