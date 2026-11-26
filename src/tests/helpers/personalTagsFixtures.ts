import { config } from "../../server/config";
import { AppointmentController } from "../../server/controllers/AppointmentController";
import { AuthController } from "../../server/controllers/AuthController";
import { BookingLinkController } from "../../server/controllers/BookingLinkController";
import { CommunityEventController } from "../../server/controllers/CommunityEventController";
import { PersonalTagController } from "../../server/controllers/PersonalTagController";
import { PlannerController } from "../../server/controllers/PlannerController";
import { PushController } from "../../server/controllers/PushController";
import { SlotController } from "../../server/controllers/SlotController";
import { VersionController } from "../../server/controllers/VersionController";
import { AppDataSource } from "../../server/db/data-source";
import { AppointmentEntity } from "../../server/entities/AppointmentEntity";
import { CommunityEventEntity } from "../../server/entities/CommunityEventEntity";
import { PlannerEventEntity } from "../../server/entities/PlannerEventEntity";
import { createServer } from "../../server/http/createServer";
import { MailService } from "../../server/mail/MailService";
import { SettingsRepository } from "../../server/repositories/SettingsRepository";
import { seedSlot } from "./databaseTestHarness";
import { futureIso } from "./dates";

export function startTestServer() {
	const { port, host } = config;
	config.port = 0;
	config.host = "127.0.0.1";
	try {
		return createServer({
			authController: new AuthController(),
			slotController: new SlotController(),
			appointmentController: new AppointmentController(),
			bookingLinkController: new BookingLinkController(),
			pushController: new PushController(),
			plannerController: new PlannerController(),
			personalTagController: new PersonalTagController(),
			communityEventController: new CommunityEventController(),
			versionController: new VersionController(),
			mailService: new MailService(),
			openApiDocument: {},
		});
	} finally {
		config.port = port;
		config.host = host;
	}
}

export async function seedTagItems() {
	const start_at = futureIso(1, 12);
	const end_at = futureIso(1, 14);
	const slot = await seedSlot({ start_at, end_at });
	const appointment = await AppDataSource.getRepository(AppointmentEntity).save(
		{
			name: "Appointment Alpha",
			note: "Appointment note",
			slug_id: "appointment-alpha",
			slot_id: slot.id,
			start_at,
			end_at: futureIso(1, 12, 15),
		},
	);
	const community = await AppDataSource.getRepository(
		CommunityEventEntity,
	).save({
		title: "Community Alpha",
		description: "Community details",
		slug_id: "community-alpha",
		start_at: futureIso(1, 15),
		end_at: futureIso(1, 17),
	});
	const [firstPlan, secondPlan, thirdPlan] = await AppDataSource.getRepository(
		PlannerEventEntity,
	).save([
		{
			title: "Plan Alpha",
			start_at: futureIso(1, 9),
			end_at: futureIso(1, 11),
		},
		{
			title: "Plan Beta",
			start_at: futureIso(1, 17),
			end_at: futureIso(1, 19),
		},
		{
			title: "Plan Gamma",
			start_at: futureIso(1, 19),
			end_at: futureIso(1, 21),
		},
	]);
	await new SettingsRepository().set("calendar_sharing", "true");
	return {
		slot,
		appointment,
		community,
		firstPlan,
		secondPlan,
		thirdPlan,
		start_at,
	};
}
