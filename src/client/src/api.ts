import type { AppColors } from "./theme";

const API_BASE = "/api";

interface ApiResponse<T> {
	success: boolean;
	data: T;
}

export interface ApiSlot {
	id: number;
	name: string | null;
	start_at: string;
	end_at: string;
	is_active: number;
	created_at: string;
}

export interface ApiBusyInterval {
	start_at: string;
	end_at: string;
}

export interface ApiPublicSlot extends ApiSlot {
	busy_intervals: ApiBusyInterval[];
}

export interface ApiAppointment {
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

export interface ApiBookingLink {
	id: number;
	name: string;
	slug_id: string;
	allowed_slot_ids: number[];
	expires_at: string;
	created_at: string;
}

export interface ApiPlannerEvent {
	id: number;
	title: string;
	description: string | null;
	start_at: string;
	end_at: string;
	color: string | null;
	created_at: string;
}

export interface ApiCommunityEvent {
	id: number;
	title: string;
	description: string | null;
	start_at: string;
	end_at: string;
	color: string | null;
	slug_id: string;
	required_approvals: number;
	current_approvals: number;
	approver_emails_json: string;
	approvals_json: string;
	status: string;
	created_at: string;
}

export interface LoginResponseData {
	must_change_password: boolean;
}

export interface AuthSessionResponseData {
	authenticated: boolean;
	must_change_password: boolean;
}

export type ApiThemeColors = AppColors;

export interface ApiVersionInfo {
	current_version: string;
	latest_release_version: string | null;
	latest_release_url: string | null;
	update_available: boolean;
}

export interface ApiWebhookSettings {
	enabled: boolean;
	url: string;
	has_secret: boolean;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
	const text = await response.text();
	const parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};

	if (!response.ok) {
		const errorMessage =
			typeof parsed.error === "string" && parsed.error.length > 0
				? parsed.error
				: "An error occurred";
		throw new Error(errorMessage);
	}

	return parsed as T;
}

async function refreshAuthSession(): Promise<boolean> {
	try {
		const response = await fetch(`${API_BASE}/auth/refresh`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		});
		return response.ok;
	} catch {
		return false;
	}
}

async function request<T>(
	endpoint: string,
	options: RequestInit = {},
	allowRefresh = true,
): Promise<T> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options.headers as Record<string, string>),
	};

	const response = await fetch(`${API_BASE}${endpoint}`, {
		...options,
		headers,
		credentials: "include",
	});

	if (
		response.status === 401 &&
		allowRefresh &&
		endpoint !== "/auth/login" &&
		endpoint !== "/auth/refresh" &&
		endpoint !== "/auth/session" &&
		endpoint !== "/auth/logout"
	) {
		const refreshed = await refreshAuthSession();
		if (refreshed) {
			return request<T>(endpoint, options, false);
		}
	}

	return parseApiResponse<T>(response);
}

// Auth
export const api = {
	login: (username: string, password: string) =>
		request<{ success: boolean; data: LoginResponseData }>("/auth/login", {
			method: "POST",
			body: JSON.stringify({ username, password }),
		}),

	getAuthSession: () =>
		request<{ success: boolean; data: AuthSessionResponseData }>(
			"/auth/session",
		),

	logout: () =>
		request<{ success: boolean }>("/auth/logout", { method: "POST" }),

	changePassword: (current_password: string, new_password: string) =>
		request<{ success: boolean; data: { changed: boolean } }>(
			"/admin/auth/change-password",
			{
				method: "PATCH",
				body: JSON.stringify({ current_password, new_password }),
			},
		),

	// Admin - Slots
	getSlots: () => request<ApiResponse<ApiSlot[]>>("/admin/slots"),

	createSlot: (name: string, start_at: string, end_at: string) =>
		request<ApiResponse<ApiSlot>>("/admin/slots", {
			method: "POST",
			body: JSON.stringify({ name, start_at, end_at }),
		}),

	toggleSlot: (id: number, is_active: boolean) =>
		request<ApiResponse<ApiSlot>>(`/admin/slots/${id}`, {
			method: "PATCH",
			body: JSON.stringify({ is_active }),
		}),

	renameSlot: (id: number, name: string) =>
		request<ApiResponse<ApiSlot>>(`/admin/slots/${id}/name`, {
			method: "PATCH",
			body: JSON.stringify({ name }),
		}),

	deleteSlot: (id: number) =>
		request<{ success: boolean }>(`/admin/slots/${id}`, {
			method: "DELETE",
		}),

	// Admin - Appointments
	getAppointments: () =>
		request<ApiResponse<ApiAppointment[]>>("/admin/appointments"),

	deleteAppointment: (slugId: string) =>
		request<{ success: boolean }>(`/admin/appointments/${slugId}`, {
			method: "DELETE",
		}),

	cancelAppointment: (slugId: string) =>
		request<ApiResponse<ApiAppointment>>(
			`/admin/appointments/${slugId}/cancel`,
			{
				method: "PATCH",
			},
		),

	// Admin - Links
	getLinks: () => request<ApiResponse<ApiBookingLink[]>>("/admin/links"),

	createLink: (input: {
		expires_in_days?: number;
		name?: string;
		slot_ids: number[];
	}) =>
		request<ApiResponse<{ link: ApiBookingLink; url: string }>>(
			"/admin/links",
			{
				method: "POST",
				body: JSON.stringify({
					expires_in_days: input.expires_in_days ?? 7,
					name: input.name,
					slot_ids: input.slot_ids,
				}),
			},
		),

	deleteLink: (id: number) =>
		request<{ success: boolean }>(`/admin/links/${id}`, {
			method: "DELETE",
		}),

	// Public
	validateToken: (slugId: string) =>
		request<ApiResponse<ApiBookingLink>>(`/public/book/${slugId}`),

	getAvailableSlots: (slugId: string) =>
		request<ApiResponse<ApiPublicSlot[]>>(`/public/book/${slugId}/slots`),

	createAppointment: (
		slugId: string,
		data: {
			slot_id: number;
			name: string;
			email?: string;
			meeting_place?: string;
			note?: string;
			start_at: string;
			end_at: string;
		},
	) =>
		request<ApiResponse<ApiAppointment>>(
			`/public/book/${slugId}/appointments`,
			{
				method: "POST",
				body: JSON.stringify(data),
			},
		),

	getPublicAppointment: (slugId: string) =>
		request<ApiResponse<ApiAppointment>>(`/public/appointment/${slugId}`),

	cancelPublicAppointment: (slugId: string) =>
		request<ApiResponse<ApiAppointment>>(
			`/public/appointment/${slugId}/cancel`,
			{
				method: "POST",
			},
		),

	// Language
	getLanguage: () =>
		request<{ success: boolean; data: { language: string } }>(
			"/settings/language",
		).then((r) => r.data.language),

	getVersionInfo: () =>
		request<{ success: boolean; data: ApiVersionInfo }>(
			"/settings/version",
		).then((r) => r.data),

	setLanguage: (language: string) =>
		request<{ success: boolean }>("/admin/settings/language", {
			method: "PUT",
			body: JSON.stringify({ language }),
		}),

	getThemeColors: () =>
		request<{ success: boolean; data: { colors: ApiThemeColors | null } }>(
			"/settings/theme-colors",
		).then((r) => r.data.colors),

	saveThemeColors: (colors: ApiThemeColors) =>
		request<{ success: boolean; data: { colors: ApiThemeColors } }>(
			"/admin/settings/theme-colors",
			{
				method: "PUT",
				body: JSON.stringify({ colors }),
			},
		),

	resetThemeColors: () =>
		request<{ success: boolean; data: { reset: boolean } }>(
			"/admin/settings/theme-colors",
			{
				method: "DELETE",
			},
		),

	getAdminEmail: () =>
		request<{ success: boolean; data: { email: string } }>(
			"/admin/settings/admin-email",
		).then((r) => r.data.email),

	setAdminEmail: (email: string) =>
		request<{ success: boolean; data: { email: string } }>(
			"/admin/settings/admin-email",
			{
				method: "PUT",
				body: JSON.stringify({ email }),
			},
		),

	// Push Notifications
	subscribeToPush: (subscription: PushSubscription) =>
		request<{ success: boolean }>("/admin/push/subscribe", {
			method: "POST",
			body: JSON.stringify({ subscription }),
		}),

	// Planner Events
	getPlannerEvents: () =>
		request<ApiResponse<ApiPlannerEvent[]>>("/admin/planner"),

	createPlannerEvent: (data: {
		title: string;
		description?: string;
		start_at: string;
		end_at: string;
		color?: string;
	}) =>
		request<ApiResponse<ApiPlannerEvent>>("/admin/planner", {
			method: "POST",
			body: JSON.stringify(data),
		}),

	updatePlannerEvent: (
		id: number,
		data: {
			title?: string;
			description?: string;
			start_at?: string;
			end_at?: string;
			color?: string;
		},
	) =>
		request<ApiResponse<ApiPlannerEvent>>(`/admin/planner/${id}`, {
			method: "PATCH",
			body: JSON.stringify(data),
		}),

	deletePlannerEvent: (id: number) =>
		request<{ success: boolean }>(`/admin/planner/${id}`, {
			method: "DELETE",
		}),

	// Calendar Sharing
	getCalendarSharing: () =>
		request<{ success: boolean; data: { enabled: boolean } }>(
			"/admin/settings/calendar-sharing",
		).then((r) => r.data.enabled),

	setCalendarSharing: (enabled: boolean) =>
		request<{ success: boolean; data: { enabled: boolean } }>(
			"/admin/settings/calendar-sharing",
			{
				method: "PUT",
				body: JSON.stringify({ enabled }),
			},
		),

	// Public Calendar
	getPublicCalendar: () =>
		request<{
			success: boolean;
			data: {
				slots: ApiSlot[];
				appointments: ApiAppointment[];
				planner_events: ApiPlannerEvent[];
				community_events: ApiCommunityEvent[];
			};
		}>("/public/calendar"),

	// Notification Settings
	getPushNotifications: () =>
		request<{ success: boolean; data: { enabled: boolean } }>(
			"/admin/settings/push-notifications",
		).then((r) => r.data.enabled),

	setPushNotifications: (enabled: boolean) =>
		request<{ success: boolean; data: { enabled: boolean } }>(
			"/admin/settings/push-notifications",
			{
				method: "PUT",
				body: JSON.stringify({ enabled }),
			},
		),

	getEmailNotifications: () =>
		request<{ success: boolean; data: { enabled: boolean } }>(
			"/admin/settings/email-notifications",
		).then((r) => r.data.enabled),

	setEmailNotifications: (enabled: boolean) =>
		request<{ success: boolean; data: { enabled: boolean } }>(
			"/admin/settings/email-notifications",
			{
				method: "PUT",
				body: JSON.stringify({ enabled }),
			},
		),

	getWebhookSettings: () =>
		request<{ success: boolean; data: ApiWebhookSettings }>(
			"/admin/settings/webhook",
		).then((r) => r.data),

	setWebhookSettings: (input: {
		enabled: boolean;
		url: string;
		secret?: string;
	}) =>
		request<{ success: boolean; data: ApiWebhookSettings }>(
			"/admin/settings/webhook",
			{
				method: "PUT",
				body: JSON.stringify(input),
			},
		).then((r) => r.data),

	sendWebhookTest: () =>
		request<{ success: boolean; data: { sent: boolean } }>(
			"/admin/settings/webhook/test",
			{
				method: "POST",
			},
		),

	// ICS Export
	getIcsExportUrl: (from?: string, to?: string) => {
		const params = new URLSearchParams();
		if (from) params.set("from", from);
		if (to) params.set("to", to);
		const query = params.toString();
		return `${API_BASE}/admin/export/ics${query ? `?${query}` : ""}`;
	},

	// Community Events
	getCommunityEvents: () =>
		request<ApiResponse<ApiCommunityEvent[]>>("/admin/community-events"),

	createCommunityEvent: (data: {
		title: string;
		description?: string;
		start_at: string;
		end_at: string;
		color?: string;
		required_approvals?: number;
	}) =>
		request<ApiResponse<ApiCommunityEvent>>("/admin/community-events", {
			method: "POST",
			body: JSON.stringify(data),
		}),

	deleteCommunityEvent: (slugId: string) =>
		request<{ success: boolean }>(`/admin/community-events/${slugId}`, {
			method: "DELETE",
		}),

	// Public community event
	getPublicCommunityEvent: (slugId: string) =>
		request<ApiResponse<ApiCommunityEvent>>(`/public/community/${slugId}`),

	approveCommunityEvent: (
		slugId: string,
		data: { full_name: string; email?: string },
	) =>
		request<ApiResponse<ApiCommunityEvent>>(
			`/public/community/${slugId}/approve`,
			{
				method: "POST",
				body: JSON.stringify(data),
			},
		),
};
