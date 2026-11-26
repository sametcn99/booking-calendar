import { type EntityManager, In } from "typeorm";
import {
	type TagItem,
	type TagKind,
	type TagSnapshot,
	tagKinds,
} from "../../shared/personalTags";
import { AppDataSource } from "../db/data-source";
import { AppointmentEntity } from "../entities/AppointmentEntity";
import { CommunityEventEntity } from "../entities/CommunityEventEntity";
import { PersonalTagAssignmentEntity } from "../entities/PersonalTagAssignmentEntity";
import { PersonalTagEntity } from "../entities/PersonalTagEntity";
import { PlannerEventEntity } from "../entities/PlannerEventEntity";

const targetEntities = {
	appointment: AppointmentEntity,
	community: CommunityEventEntity,
	planner: PlannerEventEntity,
};

const targetColumns = {
	appointment: "appointment_id",
	community: "community_id",
	planner: "planner_id",
} as const;

type TagFields = Pick<PersonalTagEntity, "name" | "name_key" | "color">;
type SnapshotRow = Pick<PersonalTagEntity, "id" | "name" | "color"> &
	Pick<PersonalTagAssignmentEntity, (typeof targetColumns)[TagKind]>;

export class PersonalTagRepository {
	async snapshot(owner: string): Promise<TagSnapshot> {
		const rows = await AppDataSource.getRepository(PersonalTagEntity)
			.createQueryBuilder("tag")
			.leftJoin(
				PersonalTagAssignmentEntity,
				"assignment",
				"assignment.tag_id = tag.id",
			)
			.select("tag.id", "id")
			.addSelect("tag.name", "name")
			.addSelect("tag.color", "color")
			.addSelect("assignment.appointment_id", "appointment_id")
			.addSelect("assignment.community_id", "community_id")
			.addSelect("assignment.planner_id", "planner_id")
			.where("tag.owner = :owner", { owner })
			.orderBy("tag.name_key", "ASC")
			.addOrderBy("assignment.id", "ASC")
			.getRawMany<SnapshotRow>();

		const tags = new Map<number, TagSnapshot["tags"][number]>();
		const assignments: TagSnapshot["assignments"] = [];
		for (const row of rows) {
			const tag = tags.get(row.id) ?? {
				id: row.id,
				name: row.name,
				color: row.color,
				count: 0,
			};
			tags.set(row.id, tag);
			for (const kind of tagKinds) {
				const itemId = row[targetColumns[kind]];
				if (itemId !== null) {
					assignments.push({ tagId: tag.id, kind, itemId });
					tag.count++;
				}
			}
		}
		return { tags: [...tags.values()], assignments };
	}

	findOwned(manager: EntityManager, owner: string, id: number) {
		return manager.findOneBy(PersonalTagEntity, { owner, id });
	}

	findByName(manager: EntityManager, owner: string, name_key: string) {
		return manager.findOneBy(PersonalTagEntity, { owner, name_key });
	}

	create(manager: EntityManager, owner: string, fields: TagFields) {
		return manager.save(PersonalTagEntity, { owner, ...fields });
	}

	update(manager: EntityManager, owner: string, id: number, fields: TagFields) {
		return manager.update(PersonalTagEntity, { owner, id }, fields);
	}

	delete(manager: EntityManager, owner: string, id: number) {
		return manager.delete(PersonalTagEntity, { owner, id });
	}

	async hasTargets(manager: EntityManager, items: TagItem[]): Promise<boolean> {
		for (const kind of tagKinds) {
			const ids = items
				.filter((item) => item.kind === kind)
				.map((item) => item.itemId);
			if (
				ids.length &&
				(await manager.countBy(targetEntities[kind], { id: In(ids) })) !==
					ids.length
			) {
				return false;
			}
		}
		return true;
	}

	async apply(manager: EntityManager, tagId: number, items: TagItem[]) {
		await manager
			.createQueryBuilder()
			.insert()
			.into(PersonalTagAssignmentEntity)
			.values(
				items.map(({ kind, itemId }) => ({
					tag_id: tagId,
					[targetColumns[kind]]: itemId,
				})),
			)
			.orIgnore()
			.execute();
	}

	async remove(manager: EntityManager, tagId: number, items: TagItem[]) {
		const conditions = tagKinds.flatMap((kind) => {
			const ids = items
				.filter((item) => item.kind === kind)
				.map((item) => item.itemId);
			return ids.length
				? [{ tag_id: tagId, [targetColumns[kind]]: In(ids) }]
				: [];
		});
		await manager.delete(PersonalTagAssignmentEntity, conditions);
	}
}
