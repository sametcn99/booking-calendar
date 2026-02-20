import { closeDataSource, initializeDataSource } from "./data-source";

export async function initializeDatabase(): Promise<void> {
	await initializeDataSource();
	console.log("Database initialized successfully");
}

export async function closeDatabase(): Promise<void> {
	await closeDataSource();
}
