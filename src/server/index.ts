import { config } from "./config";
import { AppointmentController } from "./controllers/AppointmentController";
import { AuthController } from "./controllers/AuthController";
import { BookingLinkController } from "./controllers/BookingLinkController";
import { CommunityEventController } from "./controllers/CommunityEventController";
import { PlannerController } from "./controllers/PlannerController";
import { PushController } from "./controllers/PushController";
import { SlotController } from "./controllers/SlotController";
import { VersionController } from "./controllers/VersionController";
import { initializeDatabase } from "./db/database";
import { createOpenApiDocument } from "./docs/openapi";
import { createServer } from "./http/createServer";
import { loadLanguageFromDB } from "./i18n";
import { MailService } from "./mail/MailService";

await initializeDatabase();
await loadLanguageFromDB();

const dependencies = {
	authController: new AuthController(),
	slotController: new SlotController(),
	appointmentController: new AppointmentController(),
	bookingLinkController: new BookingLinkController(),
	pushController: new PushController(),
	plannerController: new PlannerController(),
	communityEventController: new CommunityEventController(),
	versionController: new VersionController(),
	mailService: new MailService(),
	openApiDocument: createOpenApiDocument(),
};

createServer(dependencies);

console.log(`Server running at http://${config.host}:${config.port}`);

setInterval(async () => {
	try {
		await dependencies.communityEventController.cancelExpiredPending();
	} catch (err) {
		console.error("Failed to cancel expired community events:", err);
	}
}, 60_000);
