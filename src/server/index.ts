import { existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config";
import { AppointmentController } from "./controllers/AppointmentController";
import { AuthController } from "./controllers/AuthController";
import { BookingLinkController } from "./controllers/BookingLinkController";
import { PlannerController } from "./controllers/PlannerController";
import { PushController } from "./controllers/PushController";
import { SlotController } from "./controllers/SlotController";
import { initializeDatabase } from "./db/database";
import { createOpenApiDocument } from "./docs/openapi";
import { renderScalarDocsPage } from "./docs/scalar";
import { getLanguage, loadLanguageFromDB, setLanguage, t } from "./i18n";
import { getAuthenticatedUser, isAuthenticated } from "./middleware/auth";
import { checkRateLimit } from "./middleware/rateLimit";
import { SettingsRepository } from "./repositories/SettingsRepository";

// Initialize DB
await initializeDatabase();

// Load language setting from DB
await loadLanguageFromDB();

// Controllers
const authController = new AuthController();
const slotController = new SlotController();
const appointmentController = new AppointmentController();
const bookingLinkController = new BookingLinkController();
const pushController = new PushController();
const plannerController = new PlannerController();
const openApiDocument = createOpenApiDocument();

// MIME types map
const mimeTypes: Record<string, string> = {
	".html": "text/html",
	".js": "application/javascript",
	".css": "text/css",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".webmanifest": "application/manifest+json",
};

const robotsHeaderValue =
	"noindex, nofollow, noarchive, nosnippet, noimageindex";

function getMimeType(path: string): string {
	const ext = path.slice(path.lastIndexOf("."));
	return mimeTypes[ext] || "application/octet-stream";
}

function jsonResponse(
	status: number,
	body: unknown,
	headers: Record<string, string> = {},
): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json",
			"X-Robots-Tag": robotsHeaderValue,
			...headers,
		},
	});
}

async function parseJsonBody<T>(request: Request): Promise<T> {
	try {
		return (await request.json()) as T;
	} catch {
		return {} as T;
	}
}

type RequestIpServer = {
	requestIP: (request: Request) => { address?: string } | null | undefined;
};

function getClientIp(request: Request, server: RequestIpServer): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}
	return server.requestIP(request)?.address || "unknown";
}

function extractPathParam(pathname: string, pattern: string): string | null {
	// pattern example: /api/slots/:id
	const patternParts = pattern.split("/");
	const pathParts = pathname.split("/");
	if (patternParts.length !== pathParts.length) return null;

	for (let i = 0; i < patternParts.length; i++) {
		if (patternParts[i].startsWith(":")) {
			return pathParts[i];
		}
		if (patternParts[i] !== pathParts[i]) return null;
	}
	return null;
}

function extractRequiredPathParam(
	pathname: string,
	pattern: string,
): string | null {
	return extractPathParam(pathname, pattern);
}

function matchRoute(pathname: string, pattern: string): boolean {
	const patternParts = pattern.split("/");
	const pathParts = pathname.split("/");
	if (patternParts.length !== pathParts.length) return false;

	for (let i = 0; i < patternParts.length; i++) {
		if (patternParts[i].startsWith(":")) continue;
		if (patternParts[i] !== pathParts[i]) return false;
	}
	return true;
}

const _server = Bun.serve({
	port: config.port,
	hostname: config.host,

	async fetch(request, server) {
		const url = new URL(request.url);
		const { pathname } = url;
		const method = request.method;

		// CORS headers
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
			"X-Robots-Tag": robotsHeaderValue,
		};

		// Handle preflight
		if (method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		// Rate limiting
		const clientIp = getClientIp(request, server);
		const rateResult = checkRateLimit(clientIp);
		if (!rateResult.allowed) {
			return jsonResponse(
				429,
				{ success: false, error: t("general.tooManyRequests") },
				{
					...corsHeaders,
					"Retry-After": String(Math.ceil(rateResult.retryAfterMs / 1000)),
				},
			);
		}

		// --- API Routes ---

		if (pathname === "/openapi.json" && method === "GET") {
			return jsonResponse(200, openApiDocument, corsHeaders);
		}

		if (pathname === "/docs" && method === "GET") {
			const docsHtml = renderScalarDocsPage({
				title: "Booking Calendar API Reference",
				specUrl: "/openapi.json",
			});

			return new Response(docsHtml, {
				status: 200,
				headers: {
					"Content-Type": "text/html; charset=utf-8",
					...corsHeaders,
				},
			});
		}

		// Auth
		if (pathname === "/api/auth/login" && method === "POST") {
			const body = await parseJsonBody<{
				username?: string;
				password?: string;
			}>(request);
			const result = await authController.login(body, clientIp);
			return jsonResponse(result.status, result.body, corsHeaders);
		}

		// Public API: Get language setting
		if (pathname === "/api/settings/language" && method === "GET") {
			return jsonResponse(
				200,
				{ success: true, data: { language: getLanguage() } },
				corsHeaders,
			);
		}

		// Public API: Validate booking token
		if (matchRoute(pathname, "/api/public/book/:token") && method === "GET") {
			const token = extractRequiredPathParam(
				pathname,
				"/api/public/book/:token",
			);
			if (!token) {
				return jsonResponse(
					400,
					{ success: false, error: t("general.invalidRoute") },
					corsHeaders,
				);
			}
			const result = await bookingLinkController.validateToken(token);
			return jsonResponse(result.status, result.body, corsHeaders);
		}

		// Public API: Get available slots
		if (
			matchRoute(pathname, "/api/public/book/:token/slots") &&
			method === "GET"
		) {
			const token = extractRequiredPathParam(
				pathname,
				"/api/public/book/:token/slots",
			);
			if (!token) {
				return jsonResponse(
					400,
					{ success: false, error: t("general.invalidRoute") },
					corsHeaders,
				);
			}
			// Validate the token first
			const validationResult = await bookingLinkController.validateToken(token);
			if (validationResult.status !== 200) {
				return jsonResponse(
					validationResult.status,
					validationResult.body,
					corsHeaders,
				);
			}

			const validatedLink = validationResult.body.data as
				| { allowed_slot_ids?: number[] }
				| undefined;
			const result = await slotController.getAvailableSlots(
				validatedLink?.allowed_slot_ids || [],
			);
			return jsonResponse(result.status, result.body, corsHeaders);
		}

		// Public API: Create appointment
		if (
			matchRoute(pathname, "/api/public/book/:token/appointments") &&
			method === "POST"
		) {
			const token = extractRequiredPathParam(
				pathname,
				"/api/public/book/:token/appointments",
			);
			if (!token) {
				return jsonResponse(
					400,
					{ success: false, error: t("general.invalidRoute") },
					corsHeaders,
				);
			}
			const body = await parseJsonBody<{
				slot_id?: number;
				name?: string;
				email?: string;
				meeting_place?: string;
				note?: string;
				start_at?: string;
				end_at?: string;
			}>(request);
			const result = await appointmentController.createAppointment(token, body);
			return jsonResponse(result.status, result.body, corsHeaders);
		}

		// Public API: View shared calendar
		if (pathname === "/api/public/calendar" && method === "GET") {
			const settingsRepo = new SettingsRepository();
			const sharingEnabled = await settingsRepo.get("calendar_sharing");
			if (sharingEnabled !== "true") {
				return jsonResponse(
					403,
					{ success: false, error: t("general.forbidden") },
					corsHeaders,
				);
			}
			const [slotsResult, appointmentsResult, plannerResult] =
				await Promise.all([
					slotController.getAllSlots(),
					appointmentController.getAllAppointments(),
					plannerController.getAllEvents(),
				]);
			return jsonResponse(
				200,
				{
					success: true,
					data: {
						slots: slotsResult.body.data,
						appointments: appointmentsResult.body.data,
						planner_events: plannerResult.body.data,
					},
				},
				corsHeaders,
			);
		}

		// Public API: Cancel appointment by token (from email button)
		if (
			matchRoute(pathname, "/api/public/appointments/cancel/:token") &&
			method === "GET"
		) {
			const token = extractRequiredPathParam(
				pathname,
				"/api/public/appointments/cancel/:token",
			);
			if (!token) {
				return jsonResponse(
					400,
					{ success: false, error: t("general.invalidRoute") },
					corsHeaders,
				);
			}

			const result =
				await appointmentController.cancelAppointmentByToken(token);
			if (result.status === 200) {
				return new Response(
					`<html><body style='font-family:Arial,sans-serif;padding:24px;background:#0a0a0a;color:#e0d6f0;'><h2>${t("cancelPage.successTitle")}</h2><p>${t("cancelPage.successMessage")}</p></body></html>`,
					{
						status: 200,
						headers: { "Content-Type": "text/html", ...corsHeaders },
					},
				);
			}

			return new Response(
				`<html><body style='font-family:Arial,sans-serif;padding:24px;background:#0a0a0a;color:#e0d6f0;'><h2>${t("cancelPage.failTitle")}</h2><p>${String(result.body.error || t("cancelPage.failDefault"))}</p></body></html>`,
				{
					status: result.status,
					headers: { "Content-Type": "text/html", ...corsHeaders },
				},
			);
		}

		// --- Admin API (protected) ---
		if (pathname.startsWith("/api/admin")) {
			const authenticated = await isAuthenticated(request);
			if (!authenticated) {
				return jsonResponse(
					401,
					{ success: false, error: t("general.unauthorized") },
					corsHeaders,
				);
			}

			const user = await getAuthenticatedUser(request);
			if (!user) {
				return jsonResponse(
					401,
					{ success: false, error: t("general.unauthorized") },
					corsHeaders,
				);
			}

			if (
				pathname === "/api/admin/auth/change-password" &&
				method === "PATCH"
			) {
				const body = await parseJsonBody<{
					current_password?: string;
					new_password?: string;
				}>(request);
				const result = await authController.changePassword(user.username, body);
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			// Slots
			if (pathname === "/api/admin/slots" && method === "GET") {
				const result = await slotController.getAllSlots();
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			if (pathname === "/api/admin/slots" && method === "POST") {
				const body = await parseJsonBody<{
					start_at?: string;
					end_at?: string;
				}>(request);
				const result = await slotController.createSlot(body);
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			if (matchRoute(pathname, "/api/admin/slots/:id") && method === "PATCH") {
				const id = Number(extractPathParam(pathname, "/api/admin/slots/:id"));
				const body = await parseJsonBody<{ is_active?: boolean }>(request);
				const result = await slotController.toggleSlotActive(id, body);
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			if (
				matchRoute(pathname, "/api/admin/slots/:id/name") &&
				method === "PATCH"
			) {
				const id = Number(
					extractPathParam(pathname, "/api/admin/slots/:id/name"),
				);
				const body = await parseJsonBody<{ name?: string }>(request);
				const result = await slotController.renameSlot(id, body);
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			if (matchRoute(pathname, "/api/admin/slots/:id") && method === "DELETE") {
				const id = Number(extractPathParam(pathname, "/api/admin/slots/:id"));
				const result = await slotController.deleteSlot(id);
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			// Appointments
			if (pathname === "/api/admin/appointments" && method === "GET") {
				const result = await appointmentController.getAllAppointments();
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			if (
				matchRoute(pathname, "/api/admin/appointments/:id") &&
				method === "DELETE"
			) {
				const id = Number(
					extractPathParam(pathname, "/api/admin/appointments/:id"),
				);
				const result = await appointmentController.deleteAppointment(id);
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			if (
				matchRoute(pathname, "/api/admin/appointments/:id/cancel") &&
				method === "PATCH"
			) {
				const id = Number(
					extractPathParam(pathname, "/api/admin/appointments/:id/cancel"),
				);
				const result = await appointmentController.cancelAppointment(id);
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			// Booking Links
			if (pathname === "/api/admin/links" && method === "GET") {
				const result = await bookingLinkController.getAllLinks();
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			if (pathname === "/api/admin/links" && method === "POST") {
				const body = await parseJsonBody<{
					expires_in_days?: number;
					name?: string;
					slot_ids?: number[];
				}>(request);
				const result = await bookingLinkController.createLink(body);
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			if (matchRoute(pathname, "/api/admin/links/:id") && method === "DELETE") {
				const id = Number(extractPathParam(pathname, "/api/admin/links/:id"));
				const result = await bookingLinkController.deleteLink(id);
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			// Admin: Set language
			if (pathname === "/api/admin/settings/language" && method === "PUT") {
				const body = await parseJsonBody<{ language?: string }>(request);
				const lang = body.language;
				if (!lang || (lang !== "en" && lang !== "tr")) {
					return jsonResponse(
						400,
						{ success: false, error: t("general.invalidLanguage") },
						corsHeaders,
					);
				}
				const settingsRepo = new SettingsRepository();
				await settingsRepo.set("language", lang);
				setLanguage(lang);
				return jsonResponse(
					200,
					{ success: true, data: { language: lang } },
					corsHeaders,
				);
			}

			if (pathname === "/api/admin/settings/admin-email" && method === "GET") {
				const settingsRepo = new SettingsRepository();
				const savedEmail = await settingsRepo.get("admin_email");
				const email = savedEmail?.trim() ?? "";
				return jsonResponse(
					200,
					{ success: true, data: { email } },
					corsHeaders,
				);
			}

			if (pathname === "/api/admin/settings/admin-email" && method === "PUT") {
				const body = await parseJsonBody<{ email?: string }>(request);
				const email = (body.email ?? "").trim();
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (email.length > 0 && !emailRegex.test(email)) {
					return jsonResponse(
						400,
						{ success: false, error: t("general.invalidEmail") },
						corsHeaders,
					);
				}

				const settingsRepo = new SettingsRepository();
				await settingsRepo.set("admin_email", email);

				return jsonResponse(
					200,
					{ success: true, data: { email } },
					corsHeaders,
				);
			}

			// Calendar sharing setting
			if (
				pathname === "/api/admin/settings/calendar-sharing" &&
				method === "GET"
			) {
				const settingsRepo = new SettingsRepository();
				const value = await settingsRepo.get("calendar_sharing");
				return jsonResponse(
					200,
					{ success: true, data: { enabled: value === "true" } },
					corsHeaders,
				);
			}

			if (
				pathname === "/api/admin/settings/calendar-sharing" &&
				method === "PUT"
			) {
				const body = await parseJsonBody<{ enabled?: boolean }>(request);
				const settingsRepo = new SettingsRepository();
				await settingsRepo.set(
					"calendar_sharing",
					body.enabled ? "true" : "false",
				);
				return jsonResponse(
					200,
					{ success: true, data: { enabled: !!body.enabled } },
					corsHeaders,
				);
			}

			// Planner Events
			if (pathname === "/api/admin/planner" && method === "GET") {
				const result = await plannerController.getAllEvents();
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			if (pathname === "/api/admin/planner" && method === "POST") {
				const body = await parseJsonBody<{
					title?: string;
					description?: string;
					start_at?: string;
					end_at?: string;
					color?: string;
				}>(request);
				const result = await plannerController.createEvent(body);
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			if (
				matchRoute(pathname, "/api/admin/planner/:id") &&
				method === "PATCH"
			) {
				const id = Number(extractPathParam(pathname, "/api/admin/planner/:id"));
				const body = await parseJsonBody<{
					title?: string;
					description?: string;
					start_at?: string;
					end_at?: string;
					color?: string;
				}>(request);
				const result = await plannerController.updateEvent(id, body);
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			if (
				matchRoute(pathname, "/api/admin/planner/:id") &&
				method === "DELETE"
			) {
				const id = Number(extractPathParam(pathname, "/api/admin/planner/:id"));
				const result = await plannerController.deleteEvent(id);
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			// Push Notifications
			if (pathname === "/api/admin/push/subscribe" && method === "POST") {
				const body = await parseJsonBody<{
					subscription: {
						endpoint: string;
						keys: { p256dh: string; auth: string };
					};
				}>(request);
				const userAgent = request.headers.get("user-agent") || undefined;
				const result = await pushController.subscribe(body, userAgent);
				return jsonResponse(result.status, result.body, corsHeaders);
			}

			return jsonResponse(
				404,
				{ success: false, error: t("general.notFound") },
				corsHeaders,
			);
		}

		// --- Static file serving ---
		const clientDist = join(import.meta.dir, "..", "client", "dist");

		// Try to serve static files
		if (pathname !== "/" && !pathname.startsWith("/api")) {
			const filePath = join(clientDist, pathname);
			// Prevent directory traversal
			if (!filePath.startsWith(clientDist)) {
				return jsonResponse(403, {
					success: false,
					error: t("general.forbidden"),
				});
			}
			if (existsSync(filePath)) {
				const file = Bun.file(filePath);
				return new Response(file, {
					headers: {
						"Content-Type": getMimeType(pathname),
						...corsHeaders,
					},
				});
			}
		}

		// SPA fallback - serve index.html for all non-api routes
		const indexPath = join(clientDist, "index.html");
		if (existsSync(indexPath)) {
			const file = Bun.file(indexPath);
			return new Response(file, {
				headers: {
					"Content-Type": "text/html",
					...corsHeaders,
				},
			});
		}

		return jsonResponse(
			404,
			{ success: false, error: t("general.notFound") },
			corsHeaders,
		);
	},
});

console.log(`Server running at http://${config.host}:${config.port}`);
