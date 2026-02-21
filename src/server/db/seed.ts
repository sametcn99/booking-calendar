import "reflect-metadata";
import { AdminCredentialEntity } from "../entities/AdminCredentialEntity";
import { AppointmentEntity } from "../entities/AppointmentEntity";
import { AvailabilitySlotEntity } from "../entities/AvailabilitySlotEntity";
import { BookingLinkEntity } from "../entities/BookingLinkEntity";
import { CommunityEventEntity } from "../entities/CommunityEventEntity";
import { PlannerEventEntity } from "../entities/PlannerEventEntity";
import { PushSubscriptionEntity } from "../entities/PushSubscriptionEntity";
import { SettingsEntity } from "../entities/SettingsEntity";
import { AppDataSource, initializeDataSource } from "./data-source";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomId(len = 12): string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	return Array.from({ length: len }, () =>
		chars.charAt(Math.floor(Math.random() * chars.length)),
	).join("");
}

function isoDate(d: Date): string {
	return d.toISOString();
}

function shift(base: Date, days: number, hours = 0, minutes = 0): Date {
	const d = new Date(base);
	d.setDate(d.getDate() + days);
	d.setHours(d.getHours() + hours, d.getMinutes() + minutes, 0, 0);
	return d;
}

function today(): Date {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

const COLORS = [
	"#4f46e5",
	"#0891b2",
	"#059669",
	"#d97706",
	"#dc2626",
	"#7c3aed",
	"#db2777",
	"#2563eb",
	"#ea580c",
	"#16a34a",
	"#6366f1",
	"#14b8a6",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
];

function pickColor(i: number): string {
	return COLORS[i % COLORS.length];
}

const FIRST_NAMES = [
	"James",
	"Emma",
	"Michael",
	"Sophia",
	"William",
	"Olivia",
	"Alexander",
	"Isabella",
	"Daniel",
	"Mia",
	"Ethan",
	"Charlotte",
	"Benjamin",
	"Amelia",
	"Lucas",
	"Harper",
	"Henry",
	"Evelyn",
	"Sebastian",
	"Abigail",
	"Jack",
	"Emily",
	"Owen",
	"Ella",
	"Nathan",
	"Scarlett",
	"Ryan",
	"Grace",
	"Leo",
	"Lily",
	"David",
	"Chloe",
	"Matthew",
	"Penelope",
	"Andrew",
	"Layla",
	"Joseph",
	"Riley",
	"Samuel",
	"Zoey",
	"Christopher",
	"Nora",
	"John",
	"Hannah",
	"Dylan",
	"Aria",
	"Caleb",
	"Eleanor",
	"Thomas",
	"Victoria",
];

const LAST_NAMES = [
	"Smith",
	"Johnson",
	"Williams",
	"Brown",
	"Jones",
	"Garcia",
	"Miller",
	"Davis",
	"Martinez",
	"Taylor",
	"Anderson",
	"Thomas",
	"Wilson",
	"Moore",
	"Clark",
	"Lee",
	"Walker",
	"Hall",
	"Allen",
	"Young",
	"King",
	"Wright",
	"Hill",
	"Scott",
	"Green",
	"Baker",
	"Adams",
	"Nelson",
	"Carter",
	"Mitchell",
];

function randomName(i: number): string {
	const fi = i % FIRST_NAMES.length;
	const li = (i + Math.floor(i / FIRST_NAMES.length)) % LAST_NAMES.length;
	return `${FIRST_NAMES[fi]} ${LAST_NAMES[li]}`;
}

function randomEmail(name: string): string {
	const slug = name.toLowerCase().replace(/\s+/g, ".");
	const domains = [
		"example.com",
		"demo.com",
		"test.org",
		"mail.com",
		"company.io",
		"work.co",
		"corp.net",
		"biz.org",
		"office.dev",
		"team.app",
	];
	return `${slug}+${randInt(1, 999)}@${pick(domains)}`;
}

const MEETING_PLACES = [
	"Zoom",
	"Google Meet",
	"Microsoft Teams",
	"Office - Room 101",
	"Office - Room 202",
	"Office - Room 303",
	"Office - Conference Room A",
	"Office - Conference Room B",
	"Office - Board Room",
	"Cafe - Downtown Branch",
	"Cafe - Central Hub",
	"Cafe - Riverside Lounge",
	"WeWork - Floor 3",
	"WeWork - Floor 7",
	"Online",
	"Phone Call",
	"Slack Huddle",
	"Discord Voice",
	null,
];

const APPOINTMENT_NOTES = [
	"Initial consultation session",
	"Project progress meeting",
	"Weekly check-in",
	"Technical support request",
	"Demo presentation",
	"Product walkthrough",
	"Training session planning",
	"Budget review discussion",
	"Client feedback review",
	"Strategy alignment meeting",
	"Team sync-up",
	"Sprint planning session",
	"Retrospective meeting",
	"Design review",
	"Code review session",
	"Quarterly business review",
	"Onboarding walkthrough",
	"Performance review discussion",
	"Contract negotiations",
	"Partnership exploration call",
	"Feature prioritization",
	"Architecture discussion",
	"Security assessment follow-up",
	"Marketing strategy session",
	"Sales pipeline review",
	"Customer success check-in",
	"Infrastructure planning",
	"Hiring panel coordination",
	"Vendor evaluation call",
	"Product roadmap alignment",
	null,
	null,
	null,
	null,
	null,
];

const SLOT_NAMES = [
	"Morning Appointment",
	"Midday Appointment",
	"Afternoon Session",
	"Evening Appointment",
	"Quick Call (15min)",
	"Standard Meeting (30min)",
	"Extended Meeting (60min)",
	"VIP Consultation",
	"Technical Support",
	"General Meeting",
	"Strategy Session",
	"Discovery Call",
	"Follow-up Meeting",
	"Onboarding Session",
	"Review & Feedback",
	null,
];

// ─── Seed Functions ──────────────────────────────────────────────────────────

async function seedSettings() {
	const repo = AppDataSource.getRepository(SettingsEntity);

	const settings: { key: string; value: string }[] = [
		{ key: "language", value: "en" },
		{ key: "admin_email", value: "admin@booking-calendar.demo" },
		{ key: "calendar_sharing", value: "true" },
		{ key: "push_notifications_enabled", value: "true" },
		{ key: "email_notifications_enabled", value: "true" },
		{ key: "webhook_notifications_enabled", value: "false" },
		{ key: "webhook_url", value: "" },
		{ key: "webhook_secret", value: "" },
		{
			key: "theme_colors",
			value: JSON.stringify({
				primary: "#4f46e5",
				secondary: "#7c3aed",
			}),
		},
	];

	for (const s of settings) {
		const existing = await repo.findOne({ where: { key: s.key } });
		if (!existing) {
			await repo.save(repo.create(s));
		}
	}
	console.log(`  ✓ Settings: ${settings.length} entries`);
}

async function seedAdminCredentials() {
	const repo = AppDataSource.getRepository(AdminCredentialEntity);
	const count = await repo.count();
	if (count > 0) {
		console.log("  ✓ Admin credentials: already exists, skipping");
		return;
	}

	const hash = await Bun.password.hash("changeme", {
		algorithm: "bcrypt",
		cost: 10,
	});

	await repo.save(
		repo.create({
			username: "admin",
			password_hash: hash,
			is_default_password: true,
		}),
	);
	console.log("  ✓ Admin credentials: 1 entry (admin / changeme)");
}

async function seedAvailabilitySlots(): Promise<AvailabilitySlotEntity[]> {
	const repo = AppDataSource.getRepository(AvailabilitySlotEntity);
	const base = today();
	const slots: Partial<AvailabilitySlotEntity>[] = [];

	// Past 2 months — slots already passed (inactive)
	for (let day = -60; day <= -1; day++) {
		const dayOfWeek = shift(base, day).getDay();
		if (dayOfWeek === 0) continue; // skip Sundays

		let hours: number[];
		if (dayOfWeek === 6) {
			hours = [10, 11, 14];
		} else {
			hours = [8, 9, 10, 11, 13, 14, 15, 16, 17];
		}

		for (const h of hours) {
			if (Math.random() < 0.25) continue;
			const duration = pick([15, 30, 30, 30, 45, 60]);
			slots.push({
				start_at: isoDate(shift(base, day, h)),
				end_at: isoDate(shift(base, day, h, duration)),
				name: pick(SLOT_NAMES),
				is_active: 0,
			});
		}
	}

	// Current and next 2 months — active slots
	for (let day = 0; day <= 60; day++) {
		const dayOfWeek = shift(base, day).getDay();
		if (dayOfWeek === 0) continue; // skip Sundays

		let hours: number[];
		if (dayOfWeek === 6) {
			hours = [10, 11, 14, 15];
		} else {
			hours = [8, 9, 10, 11, 13, 14, 15, 16, 17, 18];
		}

		for (const h of hours) {
			if (Math.random() < 0.1) continue;
			const duration = pick([15, 30, 30, 30, 45, 60]);
			slots.push({
				start_at: isoDate(shift(base, day, h)),
				end_at: isoDate(shift(base, day, h, duration)),
				name: pick(SLOT_NAMES),
				is_active: 1,
			});
		}
	}

	const saved = await repo.save(slots.map((s) => repo.create(s)));
	console.log(`  ✓ Availability slots: ${saved.length} entries`);
	return saved;
}

async function seedAppointments(slots: AvailabilitySlotEntity[]) {
	const repo = AppDataSource.getRepository(AppointmentEntity);
	const appointments: Partial<AppointmentEntity>[] = [];
	let idx = 0;

	// Book ~70% of past slots, ~50% of future slots
	for (const slot of slots) {
		const isPast = slot.is_active === 0;
		const bookRate = isPast ? 0.7 : 0.5;
		if (Math.random() > bookRate) continue;

		const name = randomName(idx);
		const email = randomEmail(name);
		const isCanceled = Math.random() < (isPast ? 0.15 : 0.08);

		const apt: Partial<AppointmentEntity> = {
			slot_id: slot.id,
			name,
			email,
			meeting_place: pick(MEETING_PLACES),
			note: pick(APPOINTMENT_NOTES),
			start_at: slot.start_at,
			end_at: slot.end_at,
			slug_id: randomId(16),
		};

		if (isCanceled) {
			apt.canceled_at = isoDate(
				new Date(
					new Date(slot.start_at).getTime() - 1000 * 60 * 60 * randInt(2, 72),
				),
			);
			apt.canceled_by = pick(["admin", "user", "user", "user"]);
		}

		appointments.push(apt);
		idx++;
	}

	const saved = await repo.save(appointments.map((a) => repo.create(a)));
	console.log(`  ✓ Appointments: ${saved.length} entries`);
}

async function seedBookingLinks(slots: AvailabilitySlotEntity[]) {
	const repo = AppDataSource.getRepository(BookingLinkEntity);
	const base = today();

	const activeSlotIds = slots.filter((s) => s.is_active === 1).map((s) => s.id);

	const links: Partial<BookingLinkEntity>[] = [
		// Active links
		{
			name: "General Booking Link",
			slug_id: "general-booking",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(0, 30)),
			expires_at: isoDate(shift(base, 30)),
		},
		{
			name: "VIP Clients",
			slug_id: "vip-clients",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(0, 50)),
			expires_at: isoDate(shift(base, 60)),
		},
		{
			name: "Technical Support Booking",
			slug_id: "tech-support",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(10, 40)),
			expires_at: isoDate(shift(base, 14)),
		},
		{
			name: "Demo Presentation",
			slug_id: "demo-presentation",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(20, 45)),
			expires_at: isoDate(shift(base, 21)),
		},
		{
			name: "Training Session",
			slug_id: "training-session",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(5, 35)),
			expires_at: isoDate(shift(base, 45)),
		},
		{
			name: "Quick Consultation",
			slug_id: "quick-consultation",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(0, 20)),
			expires_at: isoDate(shift(base, 7)),
		},
		{
			name: "Project Evaluation",
			slug_id: "project-evaluation",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(5, 40)),
			expires_at: isoDate(shift(base, 90)),
		},
		{
			name: "Client Meeting",
			slug_id: "client-meeting",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(0, 60)),
			expires_at: isoDate(shift(base, 15)),
		},
		{
			name: "Strategy Workshop",
			slug_id: "strategy-workshop",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(15, 50)),
			expires_at: isoDate(shift(base, 35)),
		},
		{
			name: "Product Feedback Session",
			slug_id: "product-feedback",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(0, 25)),
			expires_at: isoDate(shift(base, 20)),
		},
		{
			name: "Sales Discovery Call",
			slug_id: "sales-discovery",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(10, 55)),
			expires_at: isoDate(shift(base, 45)),
		},
		{
			name: "New Hire Onboarding",
			slug_id: "new-hire-onboarding",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(0, 15)),
			expires_at: isoDate(shift(base, 60)),
		},
		{
			name: "Executive Briefing",
			slug_id: "executive-briefing",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(20, 35)),
			expires_at: isoDate(shift(base, 30)),
		},
		{
			name: "Design Review Slot",
			slug_id: "design-review",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(5, 30)),
			expires_at: isoDate(shift(base, 25)),
		},
		{
			name: "Investor Meeting",
			slug_id: "investor-meeting",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(0, 10)),
			expires_at: isoDate(shift(base, 14)),
		},
		{
			name: "Partner Integration Call",
			slug_id: "partner-integration",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(30, 55)),
			expires_at: isoDate(shift(base, 40)),
		},
		{
			name: "Customer Success Review",
			slug_id: "customer-success",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(0, 40)),
			expires_at: isoDate(shift(base, 50)),
		},
		{
			name: "Architecture Review",
			slug_id: "architecture-review",
			allowed_slot_ids: JSON.stringify(activeSlotIds.slice(10, 25)),
			expires_at: isoDate(shift(base, 28)),
		},
		// Expired links
		{
			name: "Expired Link",
			slug_id: "expired-link",
			allowed_slot_ids: JSON.stringify([]),
			expires_at: isoDate(shift(base, -5)),
		},
		{
			name: "Old Campaign",
			slug_id: "old-campaign",
			allowed_slot_ids: JSON.stringify([]),
			expires_at: isoDate(shift(base, -20)),
		},
		{
			name: "Black Friday Special",
			slug_id: "black-friday-special",
			allowed_slot_ids: JSON.stringify([]),
			expires_at: isoDate(shift(base, -30)),
		},
		{
			name: "Holiday Promo",
			slug_id: "holiday-promo",
			allowed_slot_ids: JSON.stringify([]),
			expires_at: isoDate(shift(base, -15)),
		},
		{
			name: "Beta User Access",
			slug_id: "beta-user-access",
			allowed_slot_ids: JSON.stringify([]),
			expires_at: isoDate(shift(base, -45)),
		},
	];

	const saved = await repo.save(links.map((l) => repo.create(l)));
	console.log(`  ✓ Booking links: ${saved.length} entries`);
}

async function seedCommunityEvents() {
	const repo = AppDataSource.getRepository(CommunityEventEntity);
	const base = today();

	const eventTemplates: {
		title: string;
		description: string;
		dayOffset: number;
		startHour: number;
		endDayOffset: number;
		endHour: number;
		status: "active" | "pending" | "canceled";
		requiredApprovals: number;
		currentApprovals: number;
	}[] = [
		// ─── Active (approved) ───────────────────
		{
			title: "Open Source Hackathon 2026",
			description:
				"Weekend-long open source contribution event. Food and drinks provided by the sponsor. Build something awesome!",
			dayOffset: 3,
			startHour: 9,
			endDayOffset: 4,
			endHour: 18,
			status: "active",
			requiredApprovals: 3,
			currentApprovals: 3,
		},
		{
			title: "Advanced TypeScript Workshop",
			description:
				"Workshop on building advanced applications with TypeScript. Covers generics, decorators, type guards, and conditional types.",
			dayOffset: 5,
			startHour: 14,
			endDayOffset: 5,
			endHour: 17,
			status: "active",
			requiredApprovals: 2,
			currentApprovals: 2,
		},
		{
			title: "React Native Meetup",
			description:
				"Monthly React Native meetup. This month's guest speaker will talk about mobile performance optimization and Hermes engine.",
			dayOffset: 7,
			startHour: 19,
			endDayOffset: 7,
			endHour: 21,
			status: "active",
			requiredApprovals: 2,
			currentApprovals: 2,
		},
		{
			title: "DevOps & CI/CD Training",
			description:
				"Hands-on training on building modern CI/CD pipelines with Docker, Kubernetes, and GitHub Actions.",
			dayOffset: 10,
			startHour: 10,
			endDayOffset: 10,
			endHour: 16,
			status: "active",
			requiredApprovals: 3,
			currentApprovals: 3,
		},
		{
			title: "Kubernetes Hands-On Lab",
			description:
				"Practical lab covering Kubernetes cluster setup, pod management, service mesh configuration, and Helm charts.",
			dayOffset: 21,
			startHour: 9,
			endDayOffset: 21,
			endHour: 17,
			status: "active",
			requiredApprovals: 2,
			currentApprovals: 2,
		},
		{
			title: "GraphQL API Design Masterclass",
			description:
				"Modern API design principles and strategies for migrating from REST to GraphQL. Includes schema design and performance optimization.",
			dayOffset: 25,
			startHour: 14,
			endDayOffset: 25,
			endHour: 18,
			status: "active",
			requiredApprovals: 2,
			currentApprovals: 2,
		},
		{
			title: "Agile & Scrum Workshop",
			description:
				"Interactive workshop on Agile methodologies and the Scrum framework. Includes sprint planning simulation and retrospective exercises.",
			dayOffset: 8,
			startHour: 10,
			endDayOffset: 8,
			endHour: 16,
			status: "active",
			requiredApprovals: 2,
			currentApprovals: 2,
		},
		{
			title: "Microservices Architecture Deep Dive",
			description:
				"Strategies and best practices for transitioning from monolith to microservices architecture. Event sourcing and CQRS patterns.",
			dayOffset: 28,
			startHour: 10,
			endDayOffset: 28,
			endHour: 17,
			status: "active",
			requiredApprovals: 3,
			currentApprovals: 3,
		},
		{
			title: "Full-Stack JavaScript Summit",
			description:
				"All-day conference covering Node.js, React, Vue, Svelte, and emerging JavaScript frameworks. Multiple tracks and networking sessions.",
			dayOffset: 35,
			startHour: 9,
			endDayOffset: 35,
			endHour: 18,
			status: "active",
			requiredApprovals: 3,
			currentApprovals: 3,
		},
		{
			title: "Cloud Architecture Forum",
			description:
				"Expert panel on AWS, GCP, and Azure architecture patterns. Includes cost optimization strategies and multi-cloud approaches.",
			dayOffset: 40,
			startHour: 10,
			endDayOffset: 40,
			endHour: 16,
			status: "active",
			requiredApprovals: 2,
			currentApprovals: 2,
		},
		{
			title: "Tech Leadership Roundtable",
			description:
				"Quarterly gathering for engineering managers and tech leads. Discussion topics include team scaling, culture, and technical debt management.",
			dayOffset: 15,
			startHour: 17,
			endDayOffset: 15,
			endHour: 20,
			status: "active",
			requiredApprovals: 2,
			currentApprovals: 2,
		},
		{
			title: "Frontend Performance Workshop",
			description:
				"Deep dive into Core Web Vitals, lazy loading, bundle optimization, and rendering performance. Lighthouse score improvements.",
			dayOffset: 18,
			startHour: 10,
			endDayOffset: 18,
			endHour: 15,
			status: "active",
			requiredApprovals: 2,
			currentApprovals: 2,
		},
		{
			title: "Database Optimization Bootcamp",
			description:
				"Full-day bootcamp on SQL and NoSQL database optimization. Query planning, indexing strategies, and sharding techniques.",
			dayOffset: 30,
			startHour: 9,
			endDayOffset: 30,
			endHour: 17,
			status: "active",
			requiredApprovals: 3,
			currentApprovals: 3,
		},
		{
			title: "Open Source Contributor Day",
			description:
				"Bring your laptop and contribute to popular open source projects. Mentors available for first-time contributors.",
			dayOffset: 45,
			startHour: 10,
			endDayOffset: 45,
			endHour: 18,
			status: "active",
			requiredApprovals: 2,
			currentApprovals: 2,
		},
		{
			title: "API Security Best Practices",
			description:
				"Workshop on securing REST and GraphQL APIs. OAuth2, JWT best practices, rate limiting, and input validation.",
			dayOffset: 50,
			startHour: 13,
			endDayOffset: 50,
			endHour: 17,
			status: "active",
			requiredApprovals: 2,
			currentApprovals: 2,
		},

		// ─── Pending ─────────────────────────────
		{
			title: "Artificial Intelligence Panel",
			description:
				"Panel event discussing the latest developments in AI and machine learning. Featuring industry experts from leading tech companies.",
			dayOffset: 12,
			startHour: 13,
			endDayOffset: 12,
			endHour: 17,
			status: "pending",
			requiredApprovals: 3,
			currentApprovals: 1,
		},
		{
			title: "Startup Networking Night",
			description:
				"Networking event for entrepreneurs and investors. Includes pitch sessions, one-on-one meetings, and a demo showcase.",
			dayOffset: 14,
			startHour: 18,
			endDayOffset: 14,
			endHour: 22,
			status: "pending",
			requiredApprovals: 2,
			currentApprovals: 0,
		},
		{
			title: "UX/UI Design Sprint",
			description:
				"5-day intensive design sprint. Teams will work on a real product problem and present solutions to stakeholders.",
			dayOffset: 16,
			startHour: 9,
			endDayOffset: 20,
			endHour: 17,
			status: "pending",
			requiredApprovals: 3,
			currentApprovals: 2,
		},
		{
			title: "Web Security Workshop",
			description:
				"Hands-on workshop covering OWASP Top 10 security vulnerabilities and mitigation techniques. Penetration testing basics.",
			dayOffset: 22,
			startHour: 10,
			endDayOffset: 22,
			endHour: 16,
			status: "pending",
			requiredApprovals: 2,
			currentApprovals: 1,
		},
		{
			title: "Mobile App Test Automation",
			description:
				"Mobile application test automation with Appium and Detox. Covers both iOS and Android platforms and CI integration.",
			dayOffset: 32,
			startHour: 9,
			endDayOffset: 32,
			endHour: 17,
			status: "pending",
			requiredApprovals: 3,
			currentApprovals: 2,
		},
		{
			title: "Data Engineering Pipeline Design",
			description:
				"Building robust data pipelines with Apache Kafka, Spark, and Airflow. Real-time vs batch processing architectures.",
			dayOffset: 38,
			startHour: 10,
			endDayOffset: 38,
			endHour: 16,
			status: "pending",
			requiredApprovals: 3,
			currentApprovals: 1,
		},
		{
			title: "Serverless Architecture Workshop",
			description:
				"Building scalable applications with AWS Lambda, API Gateway, and DynamoDB. Cost analysis and cold start optimization.",
			dayOffset: 42,
			startHour: 9,
			endDayOffset: 42,
			endHour: 17,
			status: "pending",
			requiredApprovals: 2,
			currentApprovals: 0,
		},
		{
			title: "Rust for Backend Developers",
			description:
				"Introduction to Rust for developers coming from TypeScript/Go. Memory safety, ownership model, and async programming.",
			dayOffset: 48,
			startHour: 14,
			endDayOffset: 48,
			endHour: 18,
			status: "pending",
			requiredApprovals: 2,
			currentApprovals: 1,
		},
		{
			title: "Testing Strategies Conference",
			description:
				"Full-day conference on testing: unit, integration, E2E, property-based, and mutation testing. Best practices panel.",
			dayOffset: 52,
			startHour: 9,
			endDayOffset: 52,
			endHour: 17,
			status: "pending",
			requiredApprovals: 3,
			currentApprovals: 2,
		},
		{
			title: "Developer Productivity Summit",
			description:
				"Tools, workflows, and practices for maximizing developer productivity. AI coding assistants, monorepos, and dev containers.",
			dayOffset: 55,
			startHour: 10,
			endDayOffset: 55,
			endHour: 16,
			status: "pending",
			requiredApprovals: 2,
			currentApprovals: 0,
		},

		// ─── Canceled ────────────────────────────
		{
			title: "Python Data Science Bootcamp",
			description:
				"3-day intensive Python and data science bootcamp using Pandas, NumPy, and Scikit-learn. Canceled due to low enrollment.",
			dayOffset: -3,
			startHour: 9,
			endDayOffset: -1,
			endHour: 17,
			status: "canceled",
			requiredApprovals: 3,
			currentApprovals: 1,
		},
		{
			title: "Blockchain & Web3 Seminar",
			description:
				"Informational seminar about blockchain technologies and the Web3 ecosystem. Canceled due to speaker unavailability.",
			dayOffset: -7,
			startHour: 14,
			endDayOffset: -7,
			endHour: 18,
			status: "canceled",
			requiredApprovals: 2,
			currentApprovals: 0,
		},
		{
			title: "VR/AR Development Workshop",
			description:
				"Hands-on workshop for VR/AR development with Unity and Unreal Engine. Canceled due to venue issues.",
			dayOffset: -15,
			startHour: 10,
			endDayOffset: -15,
			endHour: 17,
			status: "canceled",
			requiredApprovals: 3,
			currentApprovals: 2,
		},
		{
			title: "DevRel Community Mixer",
			description:
				"Casual networking event for developer relations professionals. Canceled due to scheduling conflict.",
			dayOffset: -20,
			startHour: 18,
			endDayOffset: -20,
			endHour: 21,
			status: "canceled",
			requiredApprovals: 2,
			currentApprovals: 1,
		},
		{
			title: "Low-Code Platform Showcase",
			description:
				"Showcase of leading low-code/no-code platforms. Canceled as major sponsors pulled out.",
			dayOffset: -25,
			startHour: 13,
			endDayOffset: -25,
			endHour: 17,
			status: "canceled",
			requiredApprovals: 2,
			currentApprovals: 0,
		},
		{
			title: "Game Development Jam",
			description:
				"48-hour game development jam using Godot and Unity. Canceled due to insufficient participants.",
			dayOffset: -30,
			startHour: 9,
			endDayOffset: -28,
			endHour: 17,
			status: "canceled",
			requiredApprovals: 3,
			currentApprovals: 1,
		},
		{
			title: "IoT Prototyping Workshop",
			description:
				"Build IoT prototypes with Raspberry Pi and Arduino. Canceled as hardware supplies were delayed.",
			dayOffset: -35,
			startHour: 10,
			endDayOffset: -35,
			endHour: 16,
			status: "canceled",
			requiredApprovals: 2,
			currentApprovals: 2,
		},
		{
			title: "Accessibility (a11y) Audit Sprint",
			description:
				"Collaborative sprint to improve web accessibility standards. Rescheduled to next quarter.",
			dayOffset: -40,
			startHour: 9,
			endDayOffset: -40,
			endHour: 17,
			status: "canceled",
			requiredApprovals: 2,
			currentApprovals: 1,
		},
	];

	const approverPools = [
		"coordinator@demo.com",
		"sponsor@demo.com",
		"admin@demo.com",
		"training@demo.com",
		"community@demo.com",
		"venue@demo.com",
		"it@demo.com",
		"academic@demo.com",
		"organizer@demo.com",
		"design@demo.com",
		"project@demo.com",
		"security@demo.com",
		"qa@demo.com",
		"mobile@demo.com",
		"architecture@demo.com",
		"devops@demo.com",
		"hr@demo.com",
		"marketing@demo.com",
	];

	const events: Partial<CommunityEventEntity>[] = eventTemplates.map((t, i) => {
		const approvers = approverPools
			.sort(() => Math.random() - 0.5)
			.slice(0, t.requiredApprovals);

		const approvals = approvers
			.slice(0, t.currentApprovals)
			.map((email, j) => ({
				email,
				approved_at: isoDate(shift(base, -(j + 1) * 2)),
			}));

		return {
			title: t.title,
			description: t.description,
			start_at: isoDate(shift(base, t.dayOffset, t.startHour)),
			end_at: isoDate(shift(base, t.endDayOffset, t.endHour)),
			color: pickColor(i),
			slug_id: `${t.title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.slice(0, 20)}-${randomId(6)}`,
			required_approvals: t.requiredApprovals,
			current_approvals: t.currentApprovals,
			approver_emails_json: JSON.stringify(approvers),
			approvals_json: JSON.stringify(approvals),
			status: t.status,
		};
	});

	const saved = await repo.save(events.map((e) => repo.create(e)));
	console.log(`  ✓ Community events: ${saved.length} entries`);
}

async function seedPlannerEvents() {
	const repo = AppDataSource.getRepository(PlannerEventEntity);
	const base = today();

	const eventData: {
		title: string;
		description: string;
		dayOffset: number;
		startHour: number;
		startMin?: number;
		endDayOffset: number;
		endHour: number;
		endMin?: number;
	}[] = [
		// ─── Past events ─────────────────────────
		{
			title: "Sprint 10 Planning",
			description:
				"2-week sprint planning meeting with the entire engineering team",
			dayOffset: -45,
			startHour: 10,
			endDayOffset: -45,
			endHour: 12,
		},
		{
			title: "Q3 All-Hands Meeting",
			description: "Company-wide all-hands meeting reviewing Q3 results",
			dayOffset: -42,
			startHour: 14,
			endDayOffset: -42,
			endHour: 16,
		},
		{
			title: "Sprint 10 Retrospective",
			description: "Sprint 10 retrospective — what went well, what to improve",
			dayOffset: -38,
			startHour: 15,
			endDayOffset: -38,
			endHour: 16,
			endMin: 30,
		},
		{
			title: "Infrastructure Audit",
			description:
				"Full infrastructure audit: servers, databases, CDN, and monitoring setup",
			dayOffset: -35,
			startHour: 9,
			endDayOffset: -35,
			endHour: 17,
		},
		{
			title: "Sprint 11 Planning",
			description: "Sprint planning session for sprint 11",
			dayOffset: -30,
			startHour: 10,
			endDayOffset: -30,
			endHour: 12,
		},
		{
			title: "Client B Kickoff",
			description:
				"Project kickoff meeting with Client B. Requirements gathering and timeline discussion.",
			dayOffset: -28,
			startHour: 14,
			endDayOffset: -28,
			endHour: 16,
		},
		{
			title: "Database Schema Review",
			description:
				"Review of the new database schema proposal for the booking module",
			dayOffset: -25,
			startHour: 11,
			endDayOffset: -25,
			endHour: 12,
			endMin: 30,
		},
		{
			title: "Sprint 11 Retrospective",
			description: "Sprint 11 retrospective meeting",
			dayOffset: -22,
			startHour: 15,
			endDayOffset: -22,
			endHour: 16,
			endMin: 30,
		},
		{
			title: "Production Incident Review",
			description:
				"Post-mortem review of the Friday production outage. Root cause analysis and action items.",
			dayOffset: -20,
			startHour: 10,
			endDayOffset: -20,
			endHour: 11,
			endMin: 30,
		},
		{
			title: "Sprint 12 Planning",
			description: "2-week sprint planning meeting",
			dayOffset: -10,
			startHour: 10,
			endDayOffset: -10,
			endHour: 12,
		},
		{
			title: "Client A Presentation",
			description:
				"Q4 progress report presentation. All team leads expected to attend.",
			dayOffset: -8,
			startHour: 14,
			endDayOffset: -8,
			endHour: 16,
		},
		{
			title: "Sprint 11 Retrospective",
			description: "Sprint 11 retrospective meeting",
			dayOffset: -7,
			startHour: 15,
			endDayOffset: -7,
			endHour: 16,
			endMin: 30,
		},
		{
			title: "Database Migration Planning",
			description:
				"Planning the PostgreSQL to SQLite migration process and test strategy",
			dayOffset: -5,
			startHour: 9,
			endDayOffset: -5,
			endHour: 11,
		},
		{
			title: "Hiring Panel — Senior Engineer",
			description:
				"Final round interview panel for senior software engineer position",
			dayOffset: -4,
			startHour: 14,
			endDayOffset: -4,
			endHour: 15,
			endMin: 30,
		},
		{
			title: "Budget Review Meeting",
			description: "Q1 engineering budget review with finance team",
			dayOffset: -3,
			startHour: 10,
			endDayOffset: -3,
			endHour: 11,
		},
		{
			title: "Vendor Demo — Monitoring Tool",
			description: "Demo of Datadog alternative for observability stack",
			dayOffset: -2,
			startHour: 15,
			endDayOffset: -2,
			endHour: 16,
		},

		// ─── Today / this week ───────────────────
		{
			title: "Daily Stand-up",
			description: "Every day at 9:30 AM — Quick team sync",
			dayOffset: 0,
			startHour: 9,
			startMin: 30,
			endDayOffset: 0,
			endHour: 10,
		},
		{
			title: "Code Review Session",
			description:
				"Review of PR #245 and #247. New auth system code will be reviewed.",
			dayOffset: 0,
			startHour: 14,
			endDayOffset: 0,
			endHour: 15,
			endMin: 30,
		},
		{
			title: "1:1 — Engineering Manager",
			description: "Weekly one-on-one with engineering manager",
			dayOffset: 0,
			startHour: 16,
			endDayOffset: 0,
			endHour: 16,
			endMin: 30,
		},
		{
			title: "Team Meeting",
			description:
				"Weekly team meeting. Agenda: new features, bugs, deploy schedule.",
			dayOffset: 1,
			startHour: 10,
			endDayOffset: 1,
			endHour: 11,
			endMin: 30,
		},
		{
			title: "Lunch & Learn: WebSockets",
			description: "Brown-bag session on WebSocket implementation patterns",
			dayOffset: 1,
			startHour: 12,
			endDayOffset: 1,
			endHour: 13,
		},
		{
			title: "Sprint 13 Planning",
			description:
				"Task assignment and prioritization for the next sprint. Includes backlog grooming.",
			dayOffset: 2,
			startHour: 10,
			endDayOffset: 2,
			endHour: 12,
		},
		{
			title: "1:1 — Team Lead",
			description: "Weekly one-on-one meeting with team lead",
			dayOffset: 2,
			startHour: 14,
			endDayOffset: 2,
			endHour: 14,
			endMin: 30,
		},
		{
			title: "Client C Weekly Sync",
			description: "Weekly status update call with Client C project team",
			dayOffset: 2,
			startHour: 16,
			endDayOffset: 2,
			endHour: 16,
			endMin: 45,
		},
		{
			title: "Internal Product Demo",
			description:
				"Demo of features developed over the last 2 weeks. Presentation to stakeholders.",
			dayOffset: 3,
			startHour: 15,
			endDayOffset: 3,
			endHour: 16,
			endMin: 30,
		},
		{
			title: "Architecture Decision Record Review",
			description:
				"Review proposed ADRs for event-driven architecture migration",
			dayOffset: 3,
			startHour: 11,
			endDayOffset: 3,
			endHour: 12,
		},

		// ─── Next week ───────────────────────────
		{
			title: "CI/CD Pipeline Maintenance",
			description:
				"GitHub Actions workflow update and Docker image optimization",
			dayOffset: 4,
			startHour: 9,
			endDayOffset: 4,
			endHour: 12,
		},
		{
			title: "Design Review",
			description: "Review of new dashboard designs on Figma",
			dayOffset: 5,
			startHour: 11,
			endDayOffset: 5,
			endHour: 12,
			endMin: 30,
		},
		{
			title: "Performance Testing",
			description:
				"Load testing and performance analysis of API endpoints using k6.",
			dayOffset: 6,
			startHour: 10,
			endDayOffset: 6,
			endHour: 14,
		},
		{
			title: "Security Audit",
			description: "Security scan and update of third-party dependencies",
			dayOffset: 7,
			startHour: 9,
			endDayOffset: 7,
			endHour: 11,
		},
		{
			title: "Cross-Team Alignment",
			description:
				"Monthly alignment meeting between frontend, backend, and DevOps teams",
			dayOffset: 7,
			startHour: 14,
			endDayOffset: 7,
			endHour: 15,
			endMin: 30,
		},
		{
			title: "Release v2.0 Preparation",
			description:
				"Release notes, final testing, and deploy strategy for the new version",
			dayOffset: 8,
			startHour: 10,
			endDayOffset: 8,
			endHour: 17,
		},
		{
			title: "New Developer Onboarding",
			description:
				"Introducing new team member to project structure, coding standards, and tooling",
			dayOffset: 9,
			startHour: 10,
			endDayOffset: 9,
			endHour: 16,
		},
		{
			title: "API Documentation Update",
			description: "Updating Swagger/OpenAPI docs for newly added endpoints",
			dayOffset: 10,
			startHour: 14,
			endDayOffset: 10,
			endHour: 16,
		},
		{
			title: "Stakeholder Review",
			description:
				"Presenting Q1 engineering metrics and OKR progress to stakeholders",
			dayOffset: 10,
			startHour: 10,
			endDayOffset: 10,
			endHour: 11,
			endMin: 30,
		},

		// ─── 2-4 weeks out ───────────────────────
		{
			title: "System Maintenance Window",
			description:
				"Server maintenance, SSL certificate renewal, and log rotation",
			dayOffset: 12,
			startHour: 8,
			endDayOffset: 12,
			endHour: 10,
		},
		{
			title: "Monitoring Dashboard Workshop",
			description:
				"Setting up Grafana dashboards for key business and engineering metrics",
			dayOffset: 13,
			startHour: 14,
			endDayOffset: 13,
			endHour: 16,
		},
		{
			title: "Tech Talk: Bun Runtime",
			description:
				"Advantages of the Bun.js runtime and comparison with Node.js. Internal training series.",
			dayOffset: 14,
			startHour: 16,
			endDayOffset: 14,
			endHour: 17,
			endMin: 30,
		},
		{
			title: "Sprint 14 Planning",
			description:
				"Sprint 14 planning with story point estimation and capacity planning",
			dayOffset: 15,
			startHour: 10,
			endDayOffset: 15,
			endHour: 12,
		},
		{
			title: "Dependency Upgrade Sprint",
			description:
				"Dedicated time for upgrading major dependencies and resolving breaking changes",
			dayOffset: 16,
			startHour: 9,
			endDayOffset: 16,
			endHour: 17,
		},
		{
			title: "Client A Quarterly Review",
			description:
				"Quarterly business review with Client A. Revenue, satisfaction, and roadmap alignment.",
			dayOffset: 17,
			startHour: 14,
			endDayOffset: 17,
			endHour: 16,
		},
		{
			title: "Accessibility Audit",
			description: "Full WCAG 2.1 AA compliance audit of the web application",
			dayOffset: 18,
			startHour: 9,
			endDayOffset: 18,
			endHour: 12,
		},
		{
			title: "Tech Debt Grooming",
			description:
				"Reviewing and prioritizing technical debt items in the backlog",
			dayOffset: 19,
			startHour: 14,
			endDayOffset: 19,
			endHour: 15,
			endMin: 30,
		},
		{
			title: "Annual Planning Meeting",
			description:
				"2026 product roadmap and resource planning. All department representatives will attend.",
			dayOffset: 20,
			startHour: 9,
			endDayOffset: 20,
			endHour: 17,
		},
		{
			title: "Team Offsite Planning",
			description:
				"Planning committee meeting for the upcoming team offsite event",
			dayOffset: 21,
			startHour: 11,
			endDayOffset: 21,
			endHour: 12,
		},
		{
			title: "Feature Flag Cleanup",
			description:
				"Review and cleanup of stale feature flags across the codebase",
			dayOffset: 22,
			startHour: 10,
			endDayOffset: 22,
			endHour: 11,
			endMin: 30,
		},
		{
			title: "Error Budget Review",
			description:
				"Monthly SRE error budget review. SLO compliance and incident analysis.",
			dayOffset: 23,
			startHour: 15,
			endDayOffset: 23,
			endHour: 16,
		},

		// ─── 1-2 months out ──────────────────────
		{
			title: "Sprint 15 Planning",
			description:
				"Sprint 15 planning — feature freeze for v2.1 release preparation",
			dayOffset: 25,
			startHour: 10,
			endDayOffset: 25,
			endHour: 12,
		},
		{
			title: "Engineering All-Hands",
			description:
				"Monthly engineering all-hands: wins, challenges, and upcoming initiatives",
			dayOffset: 28,
			startHour: 14,
			endDayOffset: 28,
			endHour: 15,
			endMin: 30,
		},
		{
			title: "Chaos Engineering Exercise",
			description:
				"Controlled failure injection to test system resilience and recovery procedures",
			dayOffset: 30,
			startHour: 10,
			endDayOffset: 30,
			endHour: 16,
		},
		{
			title: "Client D Onboarding",
			description:
				"Onboarding session for new enterprise client. API integration and data migration planning.",
			dayOffset: 32,
			startHour: 9,
			endDayOffset: 32,
			endHour: 12,
		},
		{
			title: "Developer Experience Survey Results",
			description:
				"Reviewing and discussing results from the quarterly developer experience survey",
			dayOffset: 35,
			startHour: 14,
			endDayOffset: 35,
			endHour: 15,
		},
		{
			title: "v2.1 Release Ceremony",
			description:
				"Release day! Final checks, deployment, monitoring, and celebration.",
			dayOffset: 38,
			startHour: 10,
			endDayOffset: 38,
			endHour: 17,
		},
		{
			title: "Cross-Functional Retro",
			description:
				"Cross-functional retrospective with product, design, and engineering",
			dayOffset: 40,
			startHour: 15,
			endDayOffset: 40,
			endHour: 16,
			endMin: 30,
		},
		{
			title: "Innovation Day",
			description:
				"Full-day innovation sprint — work on any project that improves our product or tooling",
			dayOffset: 42,
			startHour: 9,
			endDayOffset: 42,
			endHour: 17,
		},
		{
			title: "Platform Migration Kickoff",
			description:
				"Kickoff meeting for the planned cloud platform migration project",
			dayOffset: 45,
			startHour: 10,
			endDayOffset: 45,
			endHour: 12,
		},
		{
			title: "Mentorship Program Launch",
			description:
				"Launch event for the new engineering mentorship program. Mentor-mentee matching.",
			dayOffset: 48,
			startHour: 14,
			endDayOffset: 48,
			endHour: 15,
			endMin: 30,
		},
		{
			title: "Q2 OKR Setting",
			description:
				"Setting objectives and key results for Q2 across all engineering teams",
			dayOffset: 50,
			startHour: 9,
			endDayOffset: 50,
			endHour: 12,
		},
		{
			title: "Architecture Review Board",
			description:
				"Monthly architecture review board meeting. Reviewing new service proposals.",
			dayOffset: 52,
			startHour: 14,
			endDayOffset: 52,
			endHour: 16,
		},
		{
			title: "Team Offsite",
			description:
				"2-day team offsite: strategy sessions, team building, and hackathon",
			dayOffset: 55,
			startHour: 9,
			endDayOffset: 56,
			endHour: 17,
		},
	];

	const events: Partial<PlannerEventEntity>[] = eventData.map((e, i) => ({
		title: e.title,
		description: e.description,
		start_at: isoDate(shift(base, e.dayOffset, e.startHour, e.startMin ?? 0)),
		end_at: isoDate(shift(base, e.endDayOffset, e.endHour, e.endMin ?? 0)),
		color: pickColor(i),
	}));

	const saved = await repo.save(events.map((e) => repo.create(e)));
	console.log(`  ✓ Planner events: ${saved.length} entries`);
}

async function seedPushSubscriptions() {
	const repo = AppDataSource.getRepository(PushSubscriptionEntity);

	const browsers = [
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148",
		"Mozilla/5.0 (Linux; Android 14) Chrome/120.0.6099.43 Mobile",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0",
		"Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0",
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
		"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) Safari/604.1",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
		"Mozilla/5.0 (Linux; Android 13; Pixel 7) Chrome/120.0.6099.43 Mobile",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0",
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15",
	];

	const subscriptions: Partial<PushSubscriptionEntity>[] = browsers.map(
		(ua, i) => ({
			endpoint: `https://fcm.googleapis.com/fcm/send/demo-endpoint-${String(i + 1).padStart(3, "0")}-${randomId(8)}`,
			p256dh: `B${randomId(86)}`,
			auth: randomId(22),
			user_agent: ua,
		}),
	);

	const saved = await repo.save(subscriptions.map((s) => repo.create(s)));
	console.log(`  ✓ Push subscriptions: ${saved.length} entries`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
	console.log("\n🌱 Seeding database with mock data...\n");

	await initializeDataSource();

	// Check if data already exists
	const slotCount = await AppDataSource.getRepository(
		AvailabilitySlotEntity,
	).count();
	if (slotCount > 0) {
		console.log(
			"⚠️  Database already contains data. Clearing existing data...\n",
		);

		// Clear in correct order (respect foreign keys)
		await AppDataSource.getRepository(AppointmentEntity).clear();
		await AppDataSource.getRepository(BookingLinkEntity).clear();
		await AppDataSource.getRepository(CommunityEventEntity).clear();
		await AppDataSource.getRepository(PlannerEventEntity).clear();
		await AppDataSource.getRepository(PushSubscriptionEntity).clear();
		await AppDataSource.getRepository(SettingsEntity).clear();
		await AppDataSource.getRepository(AdminCredentialEntity).clear();
		await AppDataSource.getRepository(AvailabilitySlotEntity).clear();
	}

	await seedSettings();
	await seedAdminCredentials();
	const slots = await seedAvailabilitySlots();
	await seedAppointments(slots);
	await seedBookingLinks(slots);
	await seedCommunityEvents();
	await seedPlannerEvents();
	await seedPushSubscriptions();

	console.log("\n✅ Database seeded successfully!\n");
	process.exit(0);
}

main().catch((err) => {
	console.error("❌ Seeding failed:", err);
	process.exit(1);
});
