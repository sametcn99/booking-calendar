import { config } from "../config";
import { t } from "../i18n";
import { checkRateLimit } from "../middleware/rateLimit";
import { handleAdminRoutes } from "./adminRoutes";
import { handlePublicRoutes } from "./publicRoutes";
import { handleStaticRoutes } from "./staticRoutes";
import type { ServerDependencies } from "./types";
import { getClientIp, jsonResponse, robotsHeaderValue } from "./utils";

export function createServer(dependencies: ServerDependencies) {
	return Bun.serve({
		port: config.port,
		hostname: config.host,
		async fetch(request, server) {
			const url = new URL(request.url);
			const { pathname } = url;
			const method = request.method;

			const corsHeaders = {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods":
					"GET, POST, PUT, PATCH, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"X-Robots-Tag": robotsHeaderValue,
			};

			if (method === "OPTIONS") {
				return new Response(null, { status: 204, headers: corsHeaders });
			}

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

			const routeArgs = {
				...dependencies,
				request,
				url,
				pathname,
				method,
				corsHeaders,
				clientIp,
			};

			const publicResponse = await handlePublicRoutes(routeArgs);
			if (publicResponse) {
				return publicResponse;
			}

			const adminResponse = await handleAdminRoutes(routeArgs);
			if (adminResponse) {
				return adminResponse;
			}

			return handleStaticRoutes(pathname, corsHeaders);
		},
	});
}
