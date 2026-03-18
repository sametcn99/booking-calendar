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

export type CalDAVErrorCategory =
	| "auth"
	| "network"
	| "conflict"
	| "validation"
	| "calendar"
	| "unknown";

export type CalDAVQueueStatus = "idle" | "syncing" | "retryable" | "failed";

export type CalDAVSyncPolicy =
	| "one_way_write"
	| "read_only_busy"
	| "two_way_guarded";

export type CalDAVConflictState = "detected";

export type CalDAVRepairAction = "retry" | "refresh_etag" | "force_overwrite";

export interface CalDAVErrorBreakdown {
	auth: number;
	network: number;
	conflict: number;
	validation: number;
	calendar: number;
	unknown: number;
}

export interface CalDAVQueueSummary {
	idle: number;
	syncing: number;
	retryable: number;
	failed: number;
	total: number;
}

export interface CalDAVDegradedModeStatus {
	enabled: boolean;
	reason: string | null;
	threshold: number;
	active_failed_count: number;
}

export interface CalDAVQueueItem {
	appointment_id: number;
	slug_id: string | null;
	name: string;
	status: CalDAVQueueStatus;
	retry_count: number;
	next_retry_at: string | null;
	error_category: CalDAVErrorCategory | null;
	error_message: string | null;
	queued_at: string | null;
	last_synced_at: string | null;
	conflict: {
		state: CalDAVConflictState;
		detail: string | null;
		local_etag: string | null;
		remote_etag: string | null;
		detected_at: string | null;
		count: number;
	} | null;
	available_actions: CalDAVRepairAction[];
}

export interface CalDAVCalendarSummary {
	url: string;
	display_name: string;
	color: string | null;
	ctag: string | null;
	supports_events: boolean;
}

export interface CalDAVSettings {
	enabled: boolean;
	base_url: string;
	username: string;
	has_password: boolean;
	writable_calendar_url: string;
	default_sync_policy: CalDAVSyncPolicy;
	last_sync_at: string | null;
	last_sync_status: "idle" | "ok" | "error";
	last_sync_error: string | null;
}

export interface CalDAVSettingsWithCalendars extends CalDAVSettings {
	calendars: CalDAVCalendarSummary[];
}

export interface CalDAVSyncHealth {
	failed_appointments_count: number;
	retryable_appointments_count: number;
	unsynced_approved_count: number;
	error_breakdown: CalDAVErrorBreakdown;
	queue: CalDAVQueueSummary;
	degraded_mode: CalDAVDegradedModeStatus;
	background_sync_enabled: boolean;
	background_sync_interval_ms: number;
	is_sync_running: boolean;
	last_background_sync_at: string | null;
	next_background_sync_at: string | null;
}

export interface CalDAVHealthSnapshot {
	last_sync_at: string | null;
	last_sync_status: "idle" | "ok" | "error";
	last_sync_error: string | null;
	health: CalDAVSyncHealth;
}

export interface CalDAVAdminSettings extends CalDAVSettingsWithCalendars {
	health: CalDAVSyncHealth;
}

export interface CalDAVSyncRunResult {
	processed_count: number;
	success_count: number;
	failed_count: number;
	busy_refresh_succeeded: boolean;
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
	requires_approval: boolean;
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
	status: "pending" | "approved" | "rejected";
	canceled_at: string | null;
	canceled_by: string | null;
	caldav_uid: string | null;
	caldav_calendar_url: string | null;
	caldav_href: string | null;
	caldav_etag: string | null;
	caldav_last_synced_at: string | null;
	caldav_sync_error: string | null;
	caldav_error_category: CalDAVErrorCategory | null;
	caldav_error_retryable: boolean | null;
	caldav_retry_count: number | null;
	caldav_next_retry_at: string | null;
	caldav_conflict_count: number;
	caldav_last_conflict_at: string | null;
	caldav_conflict_state: CalDAVConflictState | null;
	caldav_conflict_detail: string | null;
	caldav_remote_etag: string | null;
	caldav_queue_status: CalDAVQueueStatus | null;
	caldav_queued_at: string | null;
	caldav_sync_policy: CalDAVSyncPolicy | null;
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
	status?: "pending" | "approved" | "rejected";
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
	requires_approval?: boolean;
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
