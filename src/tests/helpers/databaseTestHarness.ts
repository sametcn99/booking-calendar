import {
	AppDataSource,
	initializeDataSource,
	resetDataSource,
} from "../../server/db/data-source";
import { AppointmentEntity } from "../../server/entities/AppointmentEntity";
import { AvailabilitySlotEntity } from "../../server/entities/AvailabilitySlotEntity";
import { BookingLinkEntity } from "../../server/entities/BookingLinkEntity";
import { SettingsEntity } from "../../server/entities/SettingsEntity";

export interface TestDatabaseContext {
	dbPath: string;
}

export async function createTestDatabase(): Promise<TestDatabaseContext> {
	const dbPath = `./data/booking-calendar-test-${crypto.randomUUID()}.db`;
	process.env.DB_PATH = dbPath;
	await resetDataSource({ removeDatabaseFile: true });
	await initializeDataSource();
	return { dbPath };
}

export async function destroyTestDatabase(
	_context: TestDatabaseContext,
): Promise<void> {
	await resetDataSource({ removeDatabaseFile: true });
	delete process.env.DB_PATH;
}

export async function clearDatabase(): Promise<void> {
	await AppDataSource.getRepository(AppointmentEntity).clear();
	await AppDataSource.getRepository(BookingLinkEntity).clear();
	await AppDataSource.getRepository(AvailabilitySlotEntity).clear();
	await AppDataSource.getRepository(SettingsEntity).clear();
}

export async function seedSlot(input?: Partial<AvailabilitySlotEntity>) {
	const repository = AppDataSource.getRepository(AvailabilitySlotEntity);
	return repository.save(
		repository.create({
			name: input?.name ?? "Test Slot",
			start_at: input?.start_at ?? "2026-04-01T09:00:00.000Z",
			end_at: input?.end_at ?? "2026-04-01T10:00:00.000Z",
			is_active: input?.is_active ?? 1,
		}),
	);
}
