import type { AdminRouteHandler } from "../types";
import { jsonResponse, parseJsonBody } from "../utils";

export const handleAdminPersonalTagRoutes: AdminRouteHandler = async ({
	personalTagController,
	corsHeaders,
	method,
	pathname,
	request,
	user,
}) => {
	const headers = { ...corsHeaders, "Cache-Control": "private, no-store" };
	const owner = user.username;

	if (pathname === "/api/admin/tags") {
		if (method === "GET") {
			const result = await personalTagController.list(owner);
			return jsonResponse(result.status, result.body, headers);
		}
		if (method === "POST") {
			const result = await personalTagController.create(
				owner,
				await parseJsonBody<unknown>(request),
			);
			return jsonResponse(result.status, result.body, headers);
		}
	}

	const match = /^\/api\/admin\/tags\/([1-9]\d*)(\/assignments)?$/.exec(
		pathname,
	);
	if (!match) return null;

	const id = Number(match[1]);
	if (match[2]) {
		if (method !== "PATCH") return null;
		const result = await personalTagController.changeAssignments(
			owner,
			id,
			await parseJsonBody<unknown>(request),
		);
		return jsonResponse(result.status, result.body, headers);
	}
	if (method === "PATCH") {
		const result = await personalTagController.update(
			owner,
			id,
			await parseJsonBody<unknown>(request),
		);
		return jsonResponse(result.status, result.body, headers);
	}
	if (method === "DELETE") {
		const result = await personalTagController.delete(owner, id);
		return jsonResponse(result.status, result.body, headers);
	}
	return null;
};
