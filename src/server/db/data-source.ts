import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "../config";
import { AdminCredentialEntity } from "../entities/AdminCredentialEntity";
import { AppointmentEntity } from "../entities/AppointmentEntity";
import { AvailabilitySlotEntity } from "../entities/AvailabilitySlotEntity";
import { BookingLinkEntity } from "../entities/BookingLinkEntity";
import { CommunityEventEntity } from "../entities/CommunityEventEntity";
import { PlannerEventEntity } from "../entities/PlannerEventEntity";
import { PushSubscriptionEntity } from "../entities/PushSubscriptionEntity";
import { SettingsEntity } from "../entities/SettingsEntity";

function getDatabasePath(): string {
	return config.db.path;
}

function getDirectoryPath(filePath: string): string {
	const normalized = filePath.replace(/\\/g, "/");
	const lastSeparatorIndex = normalized.lastIndexOf("/");
	if (lastSeparatorIndex <= 0) {
		return ".";
	}

	return normalized.slice(0, lastSeparatorIndex);
}

async function ensureDatabaseDirectory(dbPath: string): Promise<void> {
	const dbDir = getDirectoryPath(dbPath);
	if (!dbDir || dbDir === ".") {
		return;
	}

	const command =
		process.platform === "win32"
			? [
					"powershell",
					"-NoProfile",
					"-Command",
					`New-Item -ItemType Directory -Force -Path '${dbDir.replace(/'/g, "''")}' | Out-Null`,
				]
			: ["mkdir", "-p", dbDir];
	const processHandle = Bun.spawn(command, {
		stdout: "ignore",
		stderr: "ignore",
	});
	const exitCode = await processHandle.exited;
	if (exitCode !== 0) {
		throw new Error(`Failed to create database directory: ${dbDir}`);
	}
}

export const AppDataSource = new DataSource({
	type: "sqljs",
	location: getDatabasePath(),
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
		CommunityEventEntity,
	],
	logging: false,
	sqlJsConfig: {
		locateFile: (fileName: string) => `node_modules/sql.js/dist/${fileName}`,
	},
});

async function configureDataSourceForCurrentPath(): Promise<string> {
	const dbPath = getDatabasePath();
	await ensureDatabaseDirectory(dbPath);
	AppDataSource.setOptions({
		location: dbPath,
		database: undefined,
	});
	return dbPath;
}

export async function initializeDataSource(): Promise<void> {
	if (AppDataSource.isInitialized) return;

	const dbPath = await configureDataSourceForCurrentPath();
	const databaseFile = Bun.file(dbPath);

	if ((await databaseFile.exists()) && databaseFile.size > 0) {
		const fileBuffer = await databaseFile.arrayBuffer();
		AppDataSource.setOptions({
			database: new Uint8Array(fileBuffer),
		});
	}

	await AppDataSource.initialize();
}

export async function closeDataSource(): Promise<void> {
	if (!AppDataSource.isInitialized) return;

	const dbPath = getDatabasePath();
	await ensureDatabaseDirectory(dbPath);
	const sqljsDriver = AppDataSource.driver as unknown as {
		export: () => Uint8Array;
	};
	const exported = sqljsDriver.export();
	await Bun.write(dbPath, exported);
	await AppDataSource.destroy();
}

export async function resetDataSource(options?: {
	removeDatabaseFile?: boolean;
}): Promise<void> {
	if (AppDataSource.isInitialized) {
		await AppDataSource.destroy();
	}

	const dbPath = await configureDataSourceForCurrentPath();
	if (options?.removeDatabaseFile) {
		await Bun.write(dbPath, new Uint8Array());
	}
	AppDataSource.setOptions({
		location: dbPath,
		database: undefined,
	});
}
