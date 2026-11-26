import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	expect,
	test,
} from "bun:test";
import {
	type Browser,
	type BrowserContext,
	chromium,
	type Page,
} from "playwright";
import { config } from "../../server/config";
import type { TagSnapshot } from "../../shared/personalTags";
import {
	createTestDatabase,
	destroyTestDatabase,
	type TestDatabaseContext,
} from "../helpers/databaseTestHarness";
import { seedTagItems, startTestServer } from "../helpers/personalTagsFixtures";

let database: TestDatabaseContext;
let browser: Browser;
let context: BrowserContext;
let server: ReturnType<typeof startTestServer>;
const previousLimit = config.rateLimit.maxRequests;

beforeAll(async () => {
	if (!(await Bun.file("src/client/dist/index.html").exists())) {
		throw new Error("Run bun run build before the browser tests.");
	}
	browser = await chromium.launch();
	config.rateLimit.maxRequests = 500;
});

beforeEach(async () => {
	database = await createTestDatabase();
	await seedTagItems();
	server = startTestServer();
});

afterEach(async () => {
	await context?.close();
	await server?.stop(true);
	if (database) await destroyTestDatabase(database);
});

afterAll(async () => {
	config.rateLimit.maxRequests = previousLimit;
	await browser?.close();
});

async function signIn(page: Page) {
	page.setDefaultTimeout(6_000);
	await page.goto(new URL("/login", server.url).href);
	await page
		.getByPlaceholder("Enter your username")
		.fill(config.admin.username);
	await page
		.getByPlaceholder("Enter your password")
		.fill(config.admin.password);
	await page.getByRole("button", { name: "Sign In" }).click();
	await page.waitForURL("**/admin");
}

async function go(page: Page, path: string) {
	await page.goto(new URL(path, server.url).href);
	await page.getByRole("region", { name: "Personal tags" }).waitFor();
}

async function readTags(page: Page): Promise<TagSnapshot> {
	const response = await page.request.get(
		new URL("/api/admin/tags", server.url).href,
	);
	expect(response.ok()).toBe(true);
	return (await response.json()).data;
}

function tagControl(page: Page, label: string) {
	return page.getByRole("button", { name: `Add tag: ${label}`, exact: true });
}

async function inlineTag(page: Page, label: string, name: string) {
	await tagControl(page, label).click();
	await page.getByRole("textbox", { name: "Add tag", exact: true }).fill(name);
	await page
		.getByRole("textbox", { name: "Add tag", exact: true })
		.press("Enter");
}

test("uses tagged lists, details, filters, calendar and management on the running app", async () => {
	context = await browser.newContext({
		serviceWorkers: "block",
		viewport: { width: 1280, height: 900 },
		timezoneId: "UTC",
	});
	const page = await context.newPage();
	const runtimeErrors: string[] = [];
	page.on("pageerror", (error) => runtimeErrors.push(error.message));

	await signIn(page);
	await go(page, "/admin/planner");
	await page.getByRole("button", { name: "Create first tag" }).waitFor();

	await inlineTag(page, "Plan Alpha", "Follow up");
	await page
		.getByRole("form", { name: "Add tag" })
		.waitFor({ state: "hidden" });
	const alphaCheckbox = page.getByRole("checkbox", {
		name: "Select for bulk tagging: Plan Alpha",
	});
	const betaCheckbox = page.getByRole("checkbox", {
		name: "Select for bulk tagging: Plan Beta",
	});
	await page
		.getByRole("button", { name: "Remove tag: Follow up", exact: true })
		.waitFor();
	await alphaCheckbox.check();
	await betaCheckbox.check();
	const bulk = page.getByRole("group", { name: "Bulk tag actions" });
	await bulk.getByRole("button", { name: "Add tag", exact: true }).click();
	await page
		.getByRole("button", { name: "Add tag: Follow up", exact: true })
		.click();
	await bulk.getByText("2 selected").waitFor();
	await bulk.getByRole("button", { name: "Remove tag", exact: true }).click();
	await page
		.getByRole("form", { name: "Remove tag" })
		.getByRole("button", { name: "Remove tag: Follow up", exact: true })
		.click();
	await page
		.getByRole("button", { name: "Remove tag: Follow up", exact: true })
		.first()
		.waitFor({ state: "hidden" });
	expect((await readTags(page)).assignments).toEqual([]);

	await page.getByRole("button", { name: "Edit Event: Plan Alpha" }).click();
	const plannerDetails = page.getByRole("dialog");
	await plannerDetails
		.getByRole("button", { name: "Add tag: Plan Alpha" })
		.click();
	await plannerDetails.getByRole("textbox", { name: "Add tag" }).fill("follow");
	await plannerDetails
		.getByRole("textbox", { name: "Add tag" })
		.press("ArrowDown");
	await plannerDetails
		.getByRole("button", { name: "Add tag: Follow up" })
		.press("Enter");
	await plannerDetails
		.getByRole("form", { name: "Add tag" })
		.waitFor({ state: "hidden" });
	await plannerDetails
		.getByRole("button", { name: "Remove tag: Follow up" })
		.waitFor();
	await plannerDetails
		.getByRole("button", { name: "Cancel", exact: true })
		.click();

	await inlineTag(page, "Plan Beta", "Preparation");
	await page.getByRole("button", { name: "Filter by tag: Follow up" }).click();
	await page
		.getByRole("heading", { name: "Plan Beta" })
		.waitFor({ state: "hidden" });
	await page
		.getByRole("button", { name: "Filter by tag: Preparation" })
		.click();
	await page.getByRole("heading", { name: "Plan Beta" }).waitFor();
	await page
		.getByRole("heading", { name: "Plan Gamma" })
		.waitFor({ state: "hidden" });
	await page.reload();
	await page.getByRole("heading", { name: "Plan Alpha" }).waitFor();
	expect(
		await page
			.getByRole("button", { name: "Filter by tag: Preparation" })
			.getAttribute("aria-pressed"),
	).toBe("true");
	expect(await page.getByRole("heading", { name: "Plan Gamma" }).count()).toBe(
		0,
	);

	await go(page, "/admin/events");
	await page.getByRole("button", { name: "Details: Community Alpha" }).click();
	const eventDetails = page.getByRole("dialog", { name: "Community Alpha" });
	await eventDetails
		.getByRole("button", { name: "Add tag: Community Alpha" })
		.click();
	await eventDetails
		.getByRole("textbox", { name: "Add tag" })
		.fill("Follow up");
	await eventDetails.getByRole("textbox", { name: "Add tag" }).press("Enter");
	await eventDetails
		.getByRole("form", { name: "Add tag" })
		.waitFor({ state: "hidden" });
	await eventDetails
		.getByRole("button", { name: "Remove tag: Follow up" })
		.waitFor();
	await eventDetails
		.getByRole("button", { name: "Close", exact: true })
		.last()
		.click();
	await page.getByRole("button", { name: "Remove tag: Follow up" }).waitFor();

	await go(page, "/admin/appointments");
	await page
		.getByRole("button", { name: "Details: Appointment Alpha" })
		.click();
	const appointmentDetails = page.getByRole("dialog", {
		name: "Appointment Alpha",
	});
	await appointmentDetails.getByText("Appointment note").waitFor();
	await appointmentDetails
		.getByRole("button", { name: "Add tag: Appointment Alpha" })
		.click();
	await appointmentDetails
		.getByRole("button", { name: "Add tag: Follow up", exact: true })
		.click();
	await appointmentDetails
		.getByRole("form", { name: "Add tag" })
		.waitFor({ state: "hidden" });
	await appointmentDetails
		.getByRole("button", { name: "Remove tag: Follow up" })
		.waitFor();
	await appointmentDetails
		.getByRole("button", { name: "Close", exact: true })
		.last()
		.click();

	await go(page, "/admin");
	await page.getByRole("button", { name: "Day", exact: true }).click();
	await page.getByRole("button", { name: "Next", exact: true }).click();
	await tagControl(page, "Plan Beta").click();
	await page
		.getByRole("form", { name: "Add tag" })
		.getByRole("button", { name: "Add tag: Follow up", exact: true })
		.click();
	await page
		.getByRole("form", { name: "Add tag" })
		.waitFor({ state: "hidden" });
	await page.getByRole("button", { name: "Plan Beta", exact: true }).click();
	await page
		.getByRole("dialog", { name: "Plan Beta" })
		.getByRole("button", { name: "Remove tag: Follow up" })
		.waitFor();
	await page
		.getByRole("dialog", { name: "Plan Beta" })
		.getByRole("button", { name: "Close", exact: true })
		.last()
		.click();
	await page
		.getByRole("button", { name: "Show only tagged", exact: true })
		.click();
	await page
		.getByRole("button", { name: "Plan Gamma", exact: true })
		.waitFor({ state: "hidden" });

	await page.getByRole("button", { name: "Manage tags", exact: true }).click();
	const management = page.getByRole("dialog", { name: "Manage tags" });
	await management.getByText("Used on 4").waitFor();
	await management.getByRole("button", { name: "Edit: Follow up" }).click();
	await management.getByRole("textbox", { name: "Tag name" }).fill("Priority");
	await management.getByRole("radio", { name: "Violet" }).check();
	await page.route(
		/\/api\/admin\/tags\/\d+$/,
		(route) =>
			route.fulfill({
				status: 503,
				json: { success: false, error: "Temporary edit failure" },
			}),
		{ times: 1 },
	);
	await management.getByRole("button", { name: "Save tag" }).click();
	await page.getByText("Temporary edit failure").waitFor();
	expect(
		await management.getByRole("textbox", { name: "Tag name" }).inputValue(),
	).toBe("Priority");
	expect(
		await management.getByRole("radio", { name: "Violet" }).isChecked(),
	).toBe(true);
	expect(
		(await readTags(page)).tags.find((tag) => tag.name === "Follow up"),
	).toMatchObject({ color: "slate", count: 4 });
	await management.getByRole("button", { name: "Save tag" }).click();
	await management.getByRole("button", { name: "Edit: Priority" }).waitFor();
	expect(
		(await readTags(page)).tags.find((tag) => tag.name === "Priority"),
	).toMatchObject({ color: "violet", count: 4 });
	await management
		.getByRole("button", { name: "Delete tag: Priority" })
		.click();
	await management
		.getByText("Delete “Priority” and remove it from all 4 items?")
		.waitFor();
	await management
		.getByRole("button", { name: "Delete tag", exact: true })
		.click();
	await management.getByRole("button", { name: "Edit: Preparation" }).waitFor();
	expect((await readTags(page)).tags.map((tag) => tag.name)).toEqual([
		"Preparation",
	]);
	expect(runtimeErrors).toEqual([]);
}, 30_000);

test("keeps the mobile picker and selection consistent when a save fails", async () => {
	context = await browser.newContext({
		serviceWorkers: "block",
		viewport: { width: 390, height: 844 },
		isMobile: true,
		hasTouch: true,
	});
	const page = await context.newPage();
	await signIn(page);
	await go(page, "/admin/planner");
	let unblockFailure: () => void = () => {};
	let observedRequest: () => void = () => {};
	const failed = new Promise<void>((resolve) => {
		unblockFailure = resolve;
	});
	const requested = new Promise<void>((resolve) => {
		observedRequest = resolve;
	});
	await page.route(
		"**/api/admin/tags",
		async (route) => {
			if (route.request().method() !== "POST") return route.continue();
			observedRequest();
			await failed;
			return route.fulfill({
				status: 503,
				json: { success: false, error: "Temporary tag save failure" },
			});
		},
		{ times: 1 },
	);

	await inlineTag(page, "Plan Alpha", "Retry label");
	try {
		await requested;
		const picker = page.getByRole("form", { name: "Add tag" });
		await page
			.getByRole("button", { name: "Remove tag: Retry label" })
			.first()
			.waitFor();
		await picker.getByText("Saving tag…").waitFor();
		const panel = await picker.boundingBox();
		expect(panel).not.toBeNull();
		expect(panel?.x).toBeGreaterThanOrEqual(0);
		expect((panel?.x ?? 0) + (panel?.width ?? Infinity)).toBeLessThanOrEqual(
			390,
		);
	} finally {
		unblockFailure();
	}
	await page.getByText("Temporary tag save failure").waitFor();
	const input = page.getByRole("textbox", { name: "Add tag" });
	expect(await input.inputValue()).toBe("Retry label");
	await page
		.getByRole("button", { name: "Remove tag: Retry label" })
		.first()
		.waitFor({ state: "hidden" });
	expect((await readTags(page)).tags).toEqual([]);
	await input.press("Enter");
	await input.waitFor({ state: "hidden" });
	await page.getByRole("button", { name: "Remove tag: Retry label" }).waitFor();

	await page.route(
		"**/api/admin/tags/*/assignments",
		(route) =>
			route.fulfill({
				status: 503,
				json: { success: false, error: "Temporary removal failure" },
			}),
		{ times: 1 },
	);
	const remove = page.getByRole("button", { name: "Remove tag: Retry label" });
	await remove.click();
	await page.getByText("Temporary removal failure").waitFor();
	expect(await remove.isEnabled()).toBe(true);
	expect((await readTags(page)).tags[0].count).toBe(1);
	await remove.click();
	await remove.waitFor({ state: "hidden" });
	expect((await readTags(page)).tags[0].count).toBe(0);

	await page.goto(new URL("/appointment/appointment-alpha", server.url).href);
	await page.getByRole("heading", { name: "Appointment Details" }).waitFor();
	await page.getByText("Appointment Alpha").waitFor();
	expect(await page.getByRole("button", { name: /Add tag/ }).count()).toBe(0);
	expect(await page.getByText("Retry label").count()).toBe(0);
}, 30_000);

test("keeps personal tag responses out of the installed PWA cache", async () => {
	context = await browser.newContext();
	const page = await context.newPage();
	await signIn(page);
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
	});
	await go(page, "/admin/planner");
	await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
	await inlineTag(page, "Plan Alpha", "Never cached");
	await page
		.getByRole("form", { name: "Add tag" })
		.waitFor({ state: "hidden" });
	await page
		.getByRole("button", { name: "Remove tag: Never cached" })
		.waitFor();

	const fetchTags = () =>
		page.evaluate(async () => {
			try {
				const response = await fetch("/api/admin/tags");
				return { status: response.status, body: await response.text() };
			} catch {
				return null;
			}
		});

	const online = await fetchTags();
	expect(online?.status).toBe(200);
	expect(online?.body).toContain("Never cached");
	const cachedURLs = await page.evaluate(async () => {
		const keys = await caches.keys();
		const entries = await Promise.all(
			keys.map(async (key) => (await caches.open(key)).keys()),
		);
		return entries.flat().map((request) => new URL(request.url).pathname);
	});
	expect(cachedURLs).not.toContain("/api/admin/tags");

	const logout = await page.request.post(
		new URL("/api/auth/logout", server.url).href,
	);
	expect(logout.ok()).toBe(true);
	const signedOut = await fetchTags();
	expect(signedOut?.status).toBe(401);
	expect(signedOut?.body).not.toContain("Never cached");

	await context.setOffline(true);
	expect(await fetchTags()).toBeNull();
}, 30_000);
