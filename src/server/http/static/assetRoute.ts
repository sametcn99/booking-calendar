import { existsSync } from "node:fs";
import { join } from "node:path";
import { t } from "../../i18n";
import type { StaticRouteHandler } from "../types";
import { getMimeType, jsonResponse } from "../utils";

export const handleStaticAssetRoute: StaticRouteHandler = (args) => {
	const { pathname, corsHeaders } = args;

	if (pathname === "/" || pathname.startsWith("/api")) {
		return null;
	}

	const clientDist = join(import.meta.dir, "..", "..", "..", "client", "dist");
	const filePath = join(clientDist, pathname);
	if (!filePath.startsWith(clientDist)) {
		return jsonResponse(403, {
			success: false,
			error: t("general.forbidden"),
		});
	}
	if (!existsSync(filePath)) {
		return null;
	}

	const file = Bun.file(filePath);
	return new Response(file, {
		headers: {
			"Content-Type": getMimeType(pathname),
			...corsHeaders,
		},
	});
};
