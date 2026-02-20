import { renderScalarDocsPage } from "../../docs/scalar";
import type { PublicRouteHandler } from "../types";
import { jsonResponse } from "../utils";

export const handlePublicDocsRoutes: PublicRouteHandler = async (args) => {
	const { pathname, method, corsHeaders } = args;

	if (pathname === "/openapi.json" && method === "GET") {
		return jsonResponse(200, args.openApiDocument, corsHeaders);
	}

	if (pathname === "/docs" && method === "GET") {
		const docsHtml = renderScalarDocsPage({
			title: "Booking Calendar API Reference",
			specUrl: "/openapi.json",
		});

		return new Response(docsHtml, {
			status: 200,
			headers: {
				"Content-Type": "text/html; charset=utf-8",
				...corsHeaders,
			},
		});
	}

	return null;
};
