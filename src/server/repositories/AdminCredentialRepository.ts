import { AppDataSource } from "../db/data-source";
import { AdminCredentialEntity } from "../entities/AdminCredentialEntity";

export class AdminCredentialRepository {
	private repo() {
		return AppDataSource.getRepository(AdminCredentialEntity);
	}

	async findByUsername(
		username: string,
	): Promise<AdminCredentialEntity | null> {
		return this.repo().findOneBy({ username });
	}

	async create(
		username: string,
		passwordHash: string,
	): Promise<AdminCredentialEntity> {
		const created = this.repo().create({
			username,
			password_hash: passwordHash,
			is_default_password: true,
		});
		return this.repo().save(created);
	}

	async updatePassword(
		id: number,
		passwordHash: string,
	): Promise<AdminCredentialEntity | null> {
		await this.repo().update(id, {
			password_hash: passwordHash,
			is_default_password: false,
		});
		return this.repo().findOneBy({ id });
	}
}
