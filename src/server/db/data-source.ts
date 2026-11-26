import "reflect-metadata";
import { rename, rm } from "node:fs/promises";
import { DataSource, type EntityManager } from "typeorm";
import type { SqljsDriver } from "typeorm/driver/sqljs/SqljsDriver.js";
import { config } from "../config";
import { AdminCredentialEntity } from "../entities/AdminCredentialEntity";
import { AppointmentEntity } from "../entities/AppointmentEntity";
import { AvailabilitySlotEntity } from "../entities/AvailabilitySlotEntity";
import { BookingLinkEntity } from "../entities/BookingLinkEntity";
import { CommunityEventEntity } from "../entities/CommunityEventEntity";
import { PersonalTagAssignmentEntity } from "../entities/PersonalTagAssignmentEntity";
import { PersonalTagEntity } from "../entities/PersonalTagEntity";
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

let pendingSave: Promise<unknown> = Promise.resolve();

function saveDatabaseFile(bytes: Uint8Array): Promise<void> {
	const path = getDatabasePath();
	const stagedPath = `${path}.tmp`;
	const saved = pendingSave.then(async () => {
		try {
			await Bun.write(stagedPath, bytes);
			await rename(stagedPath, path);
		} catch (error) {
			await rm(stagedPath, { force: true }).catch(() => undefined);
			throw error;
		}
	});
	pendingSave = saved.catch(() => undefined);
	return saved;
}

export const AppDataSource = new DataSource({
	type: "sqljs",
	location: getDatabasePath(),
	autoSave: true,
	autoSaveCallback: (bytes: Uint8Array) => {
		// SQL.js reopens its connection on export, resetting connection PRAGMAs.
		const driver = AppDataSource.driver as SqljsDriver;
		const connection = driver.databaseConnection as {
			run: (sql: string) => void;
		};
		connection.run("PRAGMA foreign_keys = ON");
		return saveDatabaseFile(bytes);
	},
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
		PersonalTagEntity,
		PersonalTagAssignmentEntity,
	],
	logging: false,
	sqlJsConfig: {
		locateFile: (fileName: string) => `node_modules/sql.js/dist/${fileName}`,
	},
});

// SQL.js uses one query runner. Keep independent transactions from sharing a savepoint.
let pendingTransaction: Promise<unknown> = Promise.resolve();

export function databaseTransaction<T>(
	work: (manager: EntityManager) => Promise<T>,
): Promise<T> {
	const result = pendingTransaction.then(() => AppDataSource.transaction(work));
	pendingTransaction = result.catch(() => undefined);
	return result;
}

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
	const sqljsDriver = AppDataSource.driver as SqljsDriver;
	await saveDatabaseFile(sqljsDriver.export());
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
