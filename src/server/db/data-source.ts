import "reflect-metadata";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { DataSource } from "typeorm";
import { config } from "../config";
import { AdminCredentialEntity } from "../entities/AdminCredentialEntity";
import { AppointmentEntity } from "../entities/AppointmentEntity";
import { AvailabilitySlotEntity } from "../entities/AvailabilitySlotEntity";
import { BookingLinkEntity } from "../entities/BookingLinkEntity";
import { PlannerEventEntity } from "../entities/PlannerEventEntity";
import { PushSubscriptionEntity } from "../entities/PushSubscriptionEntity";
import { SettingsEntity } from "../entities/SettingsEntity";

const dbDir = dirname(config.db.path);
if (!existsSync(dbDir)) {
	mkdirSync(dbDir, { recursive: true });
}

export const AppDataSource = new DataSource({
	type: "sqljs",
	location: config.db.path,
	autoSave: true,
	synchronize: true,
	entities: [
		AvailabilitySlotEntity,
		BookingLinkEntity,
		AppointmentEntity,
		AdminCredentialEntity,
		SettingsEntity,
		PushSubscriptionEntity,
		PlannerEventEntity,
	],
	logging: false,
	sqlJsConfig: {
		locateFile: (fileName: string) => `node_modules/sql.js/dist/${fileName}`,
	},
});

export async function initializeDataSource(): Promise<void> {
	if (AppDataSource.isInitialized) return;

	if (existsSync(config.db.path)) {
		const fileBuffer = readFileSync(config.db.path);
		AppDataSource.setOptions({
			database: new Uint8Array(fileBuffer),
		});
	}

	await AppDataSource.initialize();
}

export async function closeDataSource(): Promise<void> {
	if (!AppDataSource.isInitialized) return;

	const sqljsDriver = AppDataSource.driver as unknown as {
		export: () => Uint8Array;
	};
	const exported = sqljsDriver.export();
	writeFileSync(config.db.path, Buffer.from(exported));
	await AppDataSource.destroy();
}
