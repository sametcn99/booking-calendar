import { t } from "../../i18n";
import type { StaticRouteHandler } from "../types";
import { jsonResponse } from "../utils";

export const handleStaticSpaFallbackRoute: StaticRouteHandler = async (
	args,
) => {
	const { corsHeaders } = args;
	const indexFile = Bun.file(
		new URL("../../../client/dist/index.html", import.meta.url),
	);

	if (!(await indexFile.exists())) {
		return jsonResponse(
			404,
			{ success: false, error: t("general.notFound") },
			corsHeaders,
		);
	}

	return new Response(indexFile, {
		headers: {
			"Content-Type": "text/html",
			...corsHeaders,
		},
	});
};
