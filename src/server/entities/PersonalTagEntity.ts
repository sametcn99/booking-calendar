import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import type { TagColor } from "../../shared/personalTags";

@Entity({ name: "personal_tags" })
@Index(["owner", "name_key"], { unique: true })
export class PersonalTagEntity {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "text" })
	owner!: string;

	@Column({ type: "text" })
	name!: string;

	@Column({ type: "text" })
	name_key!: string;

	@Column({ type: "text" })
	color!: TagColor;
}
