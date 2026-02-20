import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "settings" })
export class SettingsEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "text", unique: true })
	key!: string;

	@Column({ type: "text" })
	value!: string;
}
