import { config } from "../config";

export function createOpenApiDocument(): Record<string, unknown> {
	return {
		openapi: "3.0.3",
		info: {
			title: "Booking Calendar API",
			version: "1.0.0",
			description:
				"Detailed API reference for Booking Calendar. Includes public booking flows and admin-protected endpoints.",
		},
		servers: [{ url: config.baseUrl }],
		tags: [
			{ name: "Auth", description: "Authentication and credential management" },
			{ name: "Public", description: "Public booking endpoints" },
			{ name: "Admin Slots", description: "Admin slot management" },
			{
				name: "Admin Appointments",
				description: "Admin appointment management",
			},
			{ name: "Admin Links", description: "Admin booking-link management" },
			{
				name: "Admin Settings",
				description: "Admin language and email settings",
			},
			{ name: "Admin Planner", description: "Admin planner event management" },
			{ name: "Admin Push", description: "Admin push notifications" },
		],
		components: {
			securitySchemes: {
				BearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
			schemas: {
				ErrorResponse: {
					type: "object",
					required: ["success", "error"],
					properties: {
						success: { type: "boolean", enum: [false] },
						error: { type: "string" },
					},
				},
				AvailabilitySlot: {
					type: "object",
					properties: {
						id: { type: "integer" },
						name: { type: ["string", "null"] },
						start_at: { type: "string", format: "date-time" },
						end_at: { type: "string", format: "date-time" },
						is_active: { type: "integer", enum: [0, 1] },
						created_at: { type: "string", format: "date-time" },
					},
				},
				Appointment: {
					type: "object",
					properties: {
						id: { type: "integer" },
						slot_id: { type: "integer" },
						name: { type: "string" },
						email: { type: ["string", "null"] },
						meeting_place: { type: ["string", "null"] },
						note: { type: ["string", "null"] },
						start_at: { type: "string", format: "date-time" },
						end_at: { type: "string", format: "date-time" },
						cancel_token: { type: ["string", "null"] },
						canceled_at: { type: ["string", "null"], format: "date-time" },
						canceled_by: { type: ["string", "null"] },
						created_at: { type: "string", format: "date-time" },
					},
				},
				BookingLink: {
					type: "object",
					properties: {
						id: { type: "integer" },
						name: { type: "string" },
						slug_id: { type: "string" },
						allowed_slot_ids: {
							type: "array",
							items: { type: "integer" },
						},
						expires_at: { type: "string", format: "date-time" },
						created_at: { type: "string", format: "date-time" },
					},
				},
				PlannerEvent: {
					type: "object",
					properties: {
						id: { type: "integer" },
						title: { type: "string" },
						description: { type: ["string", "null"] },
						start_at: { type: "string", format: "date-time" },
						end_at: { type: "string", format: "date-time" },
						color: { type: ["string", "null"] },
						created_at: { type: "string", format: "date-time" },
					},
				},
				LoginData: {
					type: "object",
					required: ["token", "must_change_password"],
					properties: {
						token: { type: "string" },
						must_change_password: { type: "boolean" },
					},
				},
			},
		},
		paths: {
			"/api/auth/login": {
				post: {
					tags: ["Auth"],
					summary: "Admin login",
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["username", "password"],
									properties: {
										username: { type: "string" },
										password: { type: "string" },
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Login success",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", enum: [true] },
											data: { $ref: "#/components/schemas/LoginData" },
										},
									},
								},
							},
						},
						"400": {
							description: "Validation error",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
						"401": {
							description: "Invalid credentials",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
					},
				},
			},
			"/api/settings/language": {
				get: {
					tags: ["Public"],
					summary: "Get active language",
					responses: {
						"200": {
							description: "Active language",
						},
					},
				},
			},
			"/api/public/book/{token}": {
				get: {
					tags: ["Public"],
					summary: "Validate booking slug",
					parameters: [
						{
							name: "token",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": { description: "Valid slug" },
						"404": {
							description: "Invalid/expired slug",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
					},
				},
			},
			"/api/public/book/{token}/slots": {
				get: {
					tags: ["Public"],
					summary: "Get available slots for booking slug",
					parameters: [
						{
							name: "token",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "List of slots",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", enum: [true] },
											data: {
												type: "array",
												items: {
													$ref: "#/components/schemas/AvailabilitySlot",
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			"/api/public/book/{token}/appointments": {
				post: {
					tags: ["Public"],
					summary: "Create appointment by booking slug",
					parameters: [
						{
							name: "token",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["slot_id", "name", "start_at", "end_at"],
									properties: {
										slot_id: { type: "integer" },
										name: { type: "string" },
										email: { type: "string" },
										meeting_place: { type: "string" },
										note: { type: "string" },
										start_at: { type: "string", format: "date-time" },
										end_at: { type: "string", format: "date-time" },
									},
								},
							},
						},
					},
					responses: {
						"201": {
							description: "Appointment created",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", enum: [true] },
											data: { $ref: "#/components/schemas/Appointment" },
										},
									},
								},
							},
						},
						"400": {
							description: "Validation error",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
						"409": {
							description: "Overlapping booking",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
					},
				},
			},
			"/api/public/calendar": {
				get: {
					tags: ["Public"],
					summary: "Get shared calendar data",
					description:
						"Returns all slots, appointments, and planner events if sharing is enabled.",
					responses: {
						"200": {
							description: "Calendar data",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", enum: [true] },
											data: {
												type: "object",
												properties: {
													slots: {
														type: "array",
														items: {
															$ref: "#/components/schemas/AvailabilitySlot",
														},
													},
													appointments: {
														type: "array",
														items: { $ref: "#/components/schemas/Appointment" },
													},
													planner_events: {
														type: "array",
														items: {
															$ref: "#/components/schemas/PlannerEvent",
														},
													},
												},
											},
										},
									},
								},
							},
						},
						"403": { description: "Calendar sharing is disabled" },
					},
				},
			},
			"/api/public/appointments/cancel/{token}": {
				get: {
					tags: ["Public"],
					summary: "Cancel appointment by token",
					parameters: [
						{
							name: "token",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Returns success HTML page",
							content: {
								"text/html": { schema: { type: "string" } },
							},
						},
						"400": {
							description: "Returns failure HTML page",
							content: {
								"text/html": { schema: { type: "string" } },
							},
						},
					},
				},
			},
			"/api/admin/auth/change-password": {
				patch: {
					tags: ["Auth"],
					summary: "Change admin password",
					security: [{ BearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["current_password", "new_password"],
									properties: {
										current_password: { type: "string" },
										new_password: { type: "string" },
									},
								},
							},
						},
					},
					responses: {
						"200": { description: "Password changed" },
						"400": {
							description: "Validation error",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
						"401": { description: "Unauthorized" },
					},
				},
			},
			"/api/admin/slots": {
				get: {
					tags: ["Admin Slots"],
					summary: "List all slots",
					security: [{ BearerAuth: [] }],
					responses: { "200": { description: "Slots listed" } },
				},
				post: {
					tags: ["Admin Slots"],
					summary: "Create slot",
					security: [{ BearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["start_at", "end_at"],
									properties: {
										start_at: { type: "string", format: "date-time" },
										end_at: { type: "string", format: "date-time" },
									},
								},
							},
						},
					},
					responses: {
						"201": { description: "Slot created" },
						"400": {
							description: "Validation error",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/ErrorResponse" },
								},
							},
						},
					},
				},
			},
			"/api/admin/slots/{id}": {
				patch: {
					tags: ["Admin Slots"],
					summary: "Toggle slot active state",
					security: [{ BearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "integer" },
						},
					],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["is_active"],
									properties: {
										is_active: { type: "boolean" },
									},
								},
							},
						},
					},
					responses: { "200": { description: "Slot updated" } },
				},
				delete: {
					tags: ["Admin Slots"],
					summary: "Delete slot",
					security: [{ BearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "integer" },
						},
					],
					responses: { "200": { description: "Slot deleted" } },
				},
			},
			"/api/admin/slots/{id}/name": {
				patch: {
					tags: ["Admin Slots"],
					summary: "Rename slot",
					security: [{ BearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "integer" },
						},
					],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["name"],
									properties: {
										name: { type: "string" },
									},
								},
							},
						},
					},
					responses: { "200": { description: "Slot renamed" } },
				},
			},
			"/api/admin/appointments": {
				get: {
					tags: ["Admin Appointments"],
					summary: "List appointments",
					security: [{ BearerAuth: [] }],
					responses: { "200": { description: "Appointments listed" } },
				},
			},
			"/api/admin/appointments/{id}": {
				delete: {
					tags: ["Admin Appointments"],
					summary: "Delete appointment",
					security: [{ BearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "integer" },
						},
					],
					responses: { "200": { description: "Appointment deleted" } },
				},
			},
			"/api/admin/appointments/{id}/cancel": {
				patch: {
					tags: ["Admin Appointments"],
					summary: "Cancel appointment",
					security: [{ BearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "integer" },
						},
					],
					responses: { "200": { description: "Appointment canceled" } },
				},
			},
			"/api/admin/links": {
				get: {
					tags: ["Admin Links"],
					summary: "List booking links",
					security: [{ BearerAuth: [] }],
					responses: { "200": { description: "Links listed" } },
				},
				post: {
					tags: ["Admin Links"],
					summary: "Create booking link",
					security: [{ BearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["slot_ids"],
									properties: {
										name: { type: "string" },
										expires_in_days: { type: "integer", default: 7 },
										slot_ids: {
											type: "array",
											items: { type: "integer" },
										},
									},
								},
							},
						},
					},
					responses: {
						"201": {
							description: "Link created",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", enum: [true] },
											data: {
												type: "object",
												properties: {
													link: { $ref: "#/components/schemas/BookingLink" },
													url: { type: "string" },
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			"/api/admin/links/{id}": {
				delete: {
					tags: ["Admin Links"],
					summary: "Delete booking link",
					security: [{ BearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "integer" },
						},
					],
					responses: { "200": { description: "Link deleted" } },
				},
			},
			"/api/admin/settings/language": {
				put: {
					tags: ["Admin Settings"],
					summary: "Set language",
					security: [{ BearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["language"],
									properties: {
										language: { type: "string", enum: ["en", "tr"] },
									},
								},
							},
						},
					},
					responses: { "200": { description: "Language updated" } },
				},
			},
			"/api/admin/settings/admin-email": {
				get: {
					tags: ["Admin Settings"],
					summary: "Get admin email",
					security: [{ BearerAuth: [] }],
					responses: { "200": { description: "Email retrieved" } },
				},
				put: {
					tags: ["Admin Settings"],
					summary: "Set admin email",
					security: [{ BearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["email"],
									properties: {
										email: { type: "string" },
									},
								},
							},
						},
					},
					responses: { "200": { description: "Email updated" } },
				},
			},
			"/api/admin/settings/calendar-sharing": {
				get: {
					tags: ["Admin Settings"],
					summary: "Get calendar sharing status",
					security: [{ BearerAuth: [] }],
					responses: { "200": { description: "Status retrieved" } },
				},
				put: {
					tags: ["Admin Settings"],
					summary: "Set calendar sharing status",
					security: [{ BearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["enabled"],
									properties: {
										enabled: { type: "boolean" },
									},
								},
							},
						},
					},
					responses: { "200": { description: "Status updated" } },
				},
			},
			"/api/admin/planner": {
				get: {
					tags: ["Admin Planner"],
					summary: "List all planner events",
					security: [{ BearerAuth: [] }],
					responses: {
						"200": {
							description: "Events listed",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", enum: [true] },
											data: {
												type: "array",
												items: { $ref: "#/components/schemas/PlannerEvent" },
											},
										},
									},
								},
							},
						},
					},
				},
				post: {
					tags: ["Admin Planner"],
					summary: "Create planner event",
					security: [{ BearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["title", "start_at", "end_at"],
									properties: {
										title: { type: "string" },
										description: { type: "string" },
										start_at: { type: "string", format: "date-time" },
										end_at: { type: "string", format: "date-time" },
										color: { type: "string" },
									},
								},
							},
						},
					},
					responses: { "201": { description: "Event created" } },
				},
			},
			"/api/admin/planner/{id}": {
				patch: {
					tags: ["Admin Planner"],
					summary: "Update planner event",
					security: [{ BearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "integer" },
						},
					],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										title: { type: "string" },
										description: { type: "string" },
										start_at: { type: "string", format: "date-time" },
										end_at: { type: "string", format: "date-time" },
										color: { type: "string" },
									},
								},
							},
						},
					},
					responses: { "200": { description: "Event updated" } },
				},
				delete: {
					tags: ["Admin Planner"],
					summary: "Delete planner event",
					security: [{ BearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "integer" },
						},
					],
					responses: { "200": { description: "Event deleted" } },
				},
			},
			"/api/admin/push/subscribe": {
				post: {
					tags: ["Admin Push"],
					summary: "Subscribe to push notifications",
					security: [{ BearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									required: ["subscription"],
									properties: {
										subscription: {
											type: "object",
											required: ["endpoint", "keys"],
											properties: {
												endpoint: { type: "string" },
												keys: {
													type: "object",
													required: ["p256dh", "auth"],
													properties: {
														p256dh: { type: "string" },
														auth: { type: "string" },
													},
												},
											},
										},
									},
								},
							},
						},
					},
					responses: { "200": { description: "Subscribed" } },
				},
			},
		},
	};
}
