import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { config } from "../../../server/config";
import {
	AppDataSource,
	initializeDataSource,
} from "../../../server/db/data-source";
import { PersonalTagAssignmentEntity } from "../../../server/entities/PersonalTagAssignmentEntity";
import { PlannerEventEntity } from "../../../server/entities/PlannerEventEntity";
import { AuthService } from "../../../server/services/AuthService";
import { PersonalTagService } from "../../../server/services/PersonalTagService";
import type { ApiResponse } from "../../../server/types";
import type { TagItem, TagSnapshot } from "../../../shared/personalTags";
import {
	createTestDatabase,
	destroyTestDatabase,
	type TestDatabaseContext,
} from "../../helpers/databaseTestHarness";
import {
	seedTagItems,
	startTestServer,
} from "../../helpers/personalTagsFixtures";

let database: TestDatabaseContext;
let server: ReturnType<typeof startTestServer>;
let token: string;
let seeded: Awaited<ReturnType<typeof seedTagItems>>;

beforeEach(async () => {
	database = await createTestDatabase();
	seeded = await seedTagItems();
	server = startTestServer();
	token = await new AuthService().createAccessToken(config.admin.username);
});

afterEach(async () => {
	await server?.stop(true);
	if (database) await destroyTestDatabase(database);
});

function request(
	path: string,
	method = "GET",
	body?: unknown,
	credential: string | null = token,
) {
	const headers = new Headers({
		"Content-Type": "application/json",
		"X-Forwarded-For": crypto.randomUUID(),
	});
	if (credential) headers.set("Authorization", `Bearer ${credential}`);
	return fetch(new URL(`/api${path}`, server.url), {
		method,
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

async function snapshot(
	response: Response,
	status = 200,
): Promise<TagSnapshot> {
	expect(response.status).toBe(status);
	expect(response.headers.get("Cache-Control")).toBe("private, no-store");
	const body = (await response.json()) as ApiResponse<TagSnapshot>;
	expect(body.success).toBe(true);
	if (!body.data) throw new Error("Expected a tag snapshot");
	return body.data;
}

function itemRefs(): TagItem[] {
	return [
		{ kind: "appointment", itemId: seeded.appointment.id },
		{ kind: "community", itemId: seeded.community.id },
		{ kind: "planner", itemId: seeded.firstPlan.id },
	];
}

describe("personal tag HTTP routes", () => {
	test("adds the tag schema to a database containing existing items", async () => {
		await AppDataSource.query("DROP TABLE personal_tag_assignments");
		await AppDataSource.query("DROP TABLE personal_tags");
		await AppDataSource.destroy();
		await initializeDataSource();

		const created = await snapshot(
			await request("/admin/tags", "POST", {
				name: "After upgrade",
				items: itemRefs(),
			}),
			201,
		);
		expect(created.tags[0].count).toBe(3);
		expect(created.assignments).toHaveLength(3);
	});

	test("requires the current administrator's access token for every operation", async () => {
		for (const [path, method] of [
			["/admin/tags", "GET"],
			["/admin/tags", "POST"],
			["/admin/tags/1", "PATCH"],
			["/admin/tags/1", "DELETE"],
			["/admin/tags/1/assignments", "PATCH"],
		]) {
			expect((await request(path, method, undefined, null)).status).toBe(401);
		}
		const auth = new AuthService();
		const unrelatedToken = await auth.createAccessToken("previous-admin");
		const refreshToken = await auth.createRefreshToken(config.admin.username);
		expect(
			(await request("/admin/tags", "GET", undefined, unrelatedToken)).status,
		).toBe(401);
		expect(
			(await request("/admin/tags", "GET", undefined, refreshToken)).status,
		).toBe(401);
		expect(await snapshot(await request("/admin/tags"))).toEqual({
			tags: [],
			assignments: [],
		});
	});

	test("scopes reads, uniqueness and mutations to the authenticated owner", async () => {
		const foreign = await new PersonalTagService().create("previous-admin", {
			name: "Private",
			items: itemRefs(),
		});
		const { id } = foreign.tags[0];
		expect(await snapshot(await request("/admin/tags"))).toEqual({
			tags: [],
			assignments: [],
		});
		expect(
			(await request(`/admin/tags/${id}`, "PATCH", { name: "Changed" })).status,
		).toBe(404);
		expect(
			(
				await request(`/admin/tags/${id}/assignments`, "PATCH", {
					action: "remove",
					items: itemRefs(),
				})
			).status,
		).toBe(404);
		expect((await request(`/admin/tags/${id}`, "DELETE")).status).toBe(404);
		const own = await snapshot(
			await request("/admin/tags", "POST", {
				name: "private",
				owner: "previous-admin",
			}),
			201,
		);
		expect(own.tags[0]).toMatchObject({ name: "private", count: 0 });
		expect(own.tags[0].id).not.toBe(id);
		expect(await new PersonalTagService().list("previous-admin")).toEqual(
			foreign,
		);
	});

	test("persists all target types, keeps counts and removes assignments on deletion", async () => {
		const items = itemRefs();
		const { tags, assignments } = await snapshot(
			await request("/admin/tags", "POST", { name: "  Follow   up ", items }),
			201,
		);
		const tag = tags[0];
		expect(tag).toMatchObject({ name: "Follow up", color: "slate", count: 3 });
		expect(assignments).toEqual(
			items.map((item) => ({ ...item, tagId: tag.id })),
		);

		const batchUrl = `/admin/tags/${tag.id}/assignments`;
		const repeated = await snapshot(
			await request(batchUrl, "PATCH", {
				action: "apply",
				items: [...items, items[0]],
			}),
		);
		expect(repeated).toEqual({ tags, assignments });

		const renamed = await snapshot(
			await request(`/admin/tags/${tag.id}`, "PATCH", {
				name: "Follow through",
				color: "violet",
			}),
		);
		expect(renamed.tags[0]).toEqual({
			...tag,
			name: "Follow through",
			color: "violet",
		});

		await AppDataSource.destroy();
		await initializeDataSource();
		expect(await snapshot(await request("/admin/tags"))).toEqual(renamed);

		const removed = await snapshot(
			await request(batchUrl, "PATCH", {
				action: "remove",
				items: items.slice(0, 2),
			}),
		);
		expect(removed.assignments).toEqual([{ ...items[2], tagId: tag.id }]);
		expect(removed.tags[0].count).toBe(1);

		await AppDataSource.getRepository(PlannerEventEntity).delete(
			seeded.firstPlan.id,
		);
		const detached = await snapshot(await request("/admin/tags"));
		expect(detached.assignments).toEqual([]);
		expect(detached.tags[0].count).toBe(0);

		await snapshot(
			await request(batchUrl, "PATCH", {
				action: "apply",
				items: items.slice(0, 2),
			}),
		);
		expect(
			await snapshot(await request(`/admin/tags/${tag.id}`, "DELETE")),
		).toEqual({ tags: [], assignments: [] });
		expect(
			await AppDataSource.getRepository(PersonalTagAssignmentEntity).count(),
		).toBe(0);
	});

	test("validates input and rolls back an entire failed operation", async () => {
		for (const body of [
			null,
			{ name: "   " },
			{ name: "a".repeat(61) },
			{ name: "Tag", color: "#f00" },
			{ name: "Tag", items: [{ kind: "slot", itemId: 1 }] },
			{ name: "Tag", items: [{ kind: "planner", itemId: "1" }] },
			{
				name: "Tag",
				items: Array.from({ length: 101 }, (_, index) => ({
					kind: "planner",
					itemId: index + 1,
				})),
			},
		])
			expect((await request("/admin/tags", "POST", body)).status).toBe(400);

		const original = await snapshot(
			await request("/admin/tags", "POST", { name: "Priority" }),
			201,
		);
		const { id } = original.tags[0];
		expect(
			(await request("/admin/tags", "POST", { name: "  ＰＲＩＯＲＩＴＹ " }))
				.status,
		).toBe(409);
		const items = [...itemRefs(), { kind: "planner", itemId: 100_000 }];
		expect(
			(
				await request(`/admin/tags/${id}/assignments`, "PATCH", {
					action: "apply",
					items,
				})
			).status,
		).toBe(404);
		expect(
			(await request("/admin/tags", "POST", { name: "Missing record", items }))
				.status,
		).toBe(404);
		expect(await snapshot(await request("/admin/tags"))).toEqual(original);

		await AppDataSource.query(`
			CREATE TRIGGER reject_test_assignment BEFORE INSERT ON personal_tag_assignments
			WHEN NEW.planner_id IS NOT NULL
			BEGIN SELECT RAISE(ABORT, 'forced test failure'); END
		`);
		expect(
			(
				await request("/admin/tags", "POST", {
					name: "Must roll back",
					items: itemRefs(),
				})
			).status,
		).toBe(500);
		expect(await snapshot(await request("/admin/tags"))).toEqual(original);
		expect(
			await AppDataSource.getRepository(PersonalTagAssignmentEntity).count(),
		).toBe(0);
	});

	test("serializes concurrent creates and independent batch updates", async () => {
		const createResults = await Promise.all([
			request("/admin/tags", "POST", { name: "Priority" }),
			request("/admin/tags", "POST", { name: "priority" }),
		]);
		expect(createResults.map((result) => result.status).sort()).toEqual([
			201, 409,
		]);
		const snapshotBefore = await snapshot(await request("/admin/tags"));
		const tag = snapshotBefore.tags[0];
		const url = `/admin/tags/${tag.id}/assignments`;
		const writes = await Promise.all(
			itemRefs().map((item) =>
				request(url, "PATCH", { action: "apply", items: [item] }),
			),
		);
		expect(writes.map((result) => result.status)).toEqual([200, 200, 200]);
		const final = await snapshot(await request("/admin/tags"));
		expect(final.tags[0].count).toBe(3);
		expect(final.assignments).toEqual(
			expect.arrayContaining(
				itemRefs().map((item) => ({ ...item, tagId: tag.id })),
			),
		);
	});

	test("never includes tags in public detail, calendar or calendar export responses", async () => {
		const name = "Admin-only work label";
		await snapshot(
			await request("/admin/tags", "POST", { name, items: itemRefs() }),
			201,
		);
		for (const path of [
			"/public/calendar",
			"/public/appointment/appointment-alpha",
			"/public/community/community-alpha",
			"/admin/export/ics",
		]) {
			const response = await request(
				path,
				"GET",
				undefined,
				path.startsWith("/admin") ? token : null,
			);
			expect(response.status).toBe(200);
			const text = await response.text();
			expect(text).not.toContain(name);
			expect(text).not.toContain('"tags"');
			expect(text).not.toContain('"assignments"');
		}
	});
});
