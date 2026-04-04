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
): Promise<Response> {
	return (async () => {
		for (const handler of staticHandlers) {
			const response = await handler({ pathname, corsHeaders });
			if (response) {
				return response;
			}
		}

		// The fallback handler currently guarantees a response.
		return (await handleStaticSpaFallbackRoute({
			pathname,
			corsHeaders,
		})) as Response;
	})();
}
