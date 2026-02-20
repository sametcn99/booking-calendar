import type { AdminRouteHandler } from "../types";
import { jsonResponse, parseJsonBody } from "../utils";

export const handleAdminPushRoutes: AdminRouteHandler = async (args) => {
	const { pathname, method, corsHeaders } = args;

	if (pathname === "/api/admin/push/subscribe" && method === "POST") {
		const body = await parseJsonBody<{
			subscription: {
				endpoint: string;
				keys: { p256dh: string; auth: string };
			};
		}>(args.request);
		const userAgent = args.request.headers.get("user-agent") || undefined;
		const result = await args.pushController.subscribe(body, userAgent);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	return null;
};
