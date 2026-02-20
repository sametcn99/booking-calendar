import { handleStaticAssetRoute } from "./static/assetRoute";
import { handleStaticSpaFallbackRoute } from "./static/spaFallbackRoute";
import type { StaticRouteHandler } from "./types";

const staticHandlers: StaticRouteHandler[] = [
	handleStaticAssetRoute,
	handleStaticSpaFallbackRoute,
];

export function handleStaticRoutes(
	pathname: string,
	corsHeaders: Record<string, string>,
): Response {
	for (const handler of staticHandlers) {
		const response = handler({ pathname, corsHeaders });
		if (response) {
			return response;
		}
	}

	// The fallback handler currently guarantees a response.
	return handleStaticSpaFallbackRoute({ pathname, corsHeaders }) as Response;
}
