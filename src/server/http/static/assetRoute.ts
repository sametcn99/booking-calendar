import { t } from "../../i18n";
import type { StaticRouteHandler } from "../types";
import { getMimeType, jsonResponse } from "../utils";

export const handleStaticAssetRoute: StaticRouteHandler = async (args) => {
	const { pathname, corsHeaders } = args;

	if (pathname === "/" || pathname.startsWith("/api")) {
		return null;
	}

	const clientDistUrl = new URL("../../../client/dist/", import.meta.url);
	const fileUrl = new URL(`.${pathname}`, clientDistUrl);
	if (!fileUrl.href.startsWith(clientDistUrl.href)) {
		return jsonResponse(403, {
			success: false,
			error: t("general.forbidden"),
		});
	}

	const file = Bun.file(fileUrl);
	if (!(await file.exists())) {
		return null;
	}

	return new Response(file, {
		headers: {
			"Content-Type": getMimeType(pathname),
			...corsHeaders,
		},
	});
};
