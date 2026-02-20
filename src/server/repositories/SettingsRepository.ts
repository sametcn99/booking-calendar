import { AppDataSource } from "../db/data-source";
import { SettingsEntity } from "../entities/SettingsEntity";

export class SettingsRepository {
	private get repo() {
		return AppDataSource.getRepository(SettingsEntity);
	}

	async get(key: string): Promise<string | null> {
		const setting = await this.repo.findOne({ where: { key } });
		return setting?.value ?? null;
	}

	async set(key: string, value: string): Promise<void> {
		const existing = await this.repo.findOne({ where: { key } });
		if (existing) {
			existing.value = value;
			await this.repo.save(existing);
		} else {
			const setting = this.repo.create({ key, value });
			await this.repo.save(setting);
		}
	}

	async delete(key: string): Promise<void> {
		await this.repo.delete({ key });
	}
}
