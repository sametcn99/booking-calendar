import type { AdminRouteHandler } from "../types";
import { jsonResponse, parseJsonBody } from "../utils";

export const handleAdminAuthRoutes: AdminRouteHandler = async (args) => {
	const { pathname, method, corsHeaders } = args;

	if (pathname !== "/api/admin/auth/change-password" || method !== "PATCH") {
		return null;
	}

	const body = await parseJsonBody<{
		current_password?: string;
		new_password?: string;
	}>(args.request);
	const result = await args.authController.changePassword(
		args.user.username,
		body,
	);
	return jsonResponse(result.status, result.body, corsHeaders);
};
