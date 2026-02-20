import type { PublicRouteHandler } from "../types";
import {
	extractRequiredPathParam,
	invalidRouteResponse,
	jsonResponse,
	matchRoute,
	parseJsonBody,
} from "../utils";

export const handlePublicCommunityRoutes: PublicRouteHandler = async (args) => {
	const { pathname, method, corsHeaders } = args;

	if (
		matchRoute(pathname, "/api/public/community/:slugId") &&
		method === "GET"
	) {
		const slugId = extractRequiredPathParam(
			pathname,
			"/api/public/community/:slugId",
		);
		if (!slugId) {
			return invalidRouteResponse(corsHeaders);
		}
		const result = await args.communityEventController.getBySlugId(slugId);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	if (
		matchRoute(pathname, "/api/public/community/:slugId/approve") &&
		method === "POST"
	) {
		const slugId = extractRequiredPathParam(
			pathname,
			"/api/public/community/:slugId/approve",
		);
		if (!slugId) {
			return invalidRouteResponse(corsHeaders);
		}
		const body = await parseJsonBody<{ full_name?: string; email?: string }>(
			args.request,
		);
		const result = await args.communityEventController.approve(slugId, body);
		return jsonResponse(result.status, result.body, corsHeaders);
	}

	return null;
};
