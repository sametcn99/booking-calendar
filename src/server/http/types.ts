import type { AppointmentController } from "../controllers/AppointmentController";
import type { AuthController } from "../controllers/AuthController";
import type { BookingLinkController } from "../controllers/BookingLinkController";
import type { CommunityEventController } from "../controllers/CommunityEventController";
import type { PlannerController } from "../controllers/PlannerController";
import type { PushController } from "../controllers/PushController";
import type { SlotController } from "../controllers/SlotController";
import type { VersionController } from "../controllers/VersionController";
import type { MailService } from "../mail/MailService";

export interface ServerDependencies {
	authController: AuthController;
	slotController: SlotController;
	appointmentController: AppointmentController;
	bookingLinkController: BookingLinkController;
	pushController: PushController;
	plannerController: PlannerController;
	communityEventController: CommunityEventController;
	versionController: VersionController;
	mailService: MailService;
	openApiDocument: unknown;
}

export interface RouteHandlerArgs extends ServerDependencies {
	request: Request;
	url: URL;
	pathname: string;
	method: string;
	corsHeaders: Record<string, string>;
	clientIp: string;
}

export type PublicRouteHandler = (
	args: RouteHandlerArgs,
) => Promise<Response | null>;

export interface StaticRouteArgs {
	pathname: string;
	corsHeaders: Record<string, string>;
}

export type StaticRouteHandler = (args: StaticRouteArgs) => Response | null;

export interface AuthenticatedAdminUser {
	username: string;
}

export interface AdminRouteArgs extends RouteHandlerArgs {
	user: AuthenticatedAdminUser;
}

export type AdminRouteHandler = (
	args: AdminRouteArgs,
) => Promise<Response | null>;
