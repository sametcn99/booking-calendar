import { existsSync } from "node:fs";
import { join } from "node:path";
import { t } from "../../i18n";
import type { StaticRouteHandler } from "../types";
import { jsonResponse } from "../utils";

export const handleStaticSpaFallbackRoute: StaticRouteHandler = (args) => {
	const { corsHeaders } = args;
	const clientDist = join(import.meta.dir, "..", "..", "..", "client", "dist");
	const indexPath = join(clientDist, "index.html");

	if (!existsSync(indexPath)) {
		return jsonResponse(
			404,
			{ success: false, error: t("general.notFound") },
			corsHeaders,
		);
	}

	const file = Bun.file(indexPath);
	return new Response(file, {
		headers: {
			"Content-Type": "text/html",
			...corsHeaders,
		},
	});
};
