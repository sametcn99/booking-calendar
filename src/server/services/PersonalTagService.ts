import type { EntityManager } from "typeorm";
import {
	cleanTagName,
	type TagColor,
	type TagItem,
	tagBatchMaxSize,
	tagColors,
	tagKinds,
	tagNameKey,
	tagNameMaxLength,
} from "../../shared/personalTags";
import { databaseTransaction } from "../db/data-source";
import { PersonalTagRepository } from "../repositories/PersonalTagRepository";

export class PersonalTagError extends Error {
	constructor(
		readonly status: number,
		readonly key: string,
	) {
		super(key);
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is number {
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isTagColor(color: unknown): color is TagColor {
	return tagColors.some((choice) => choice === color);
}

function readTagFields(input: Record<string, unknown>) {
	const name = typeof input.name === "string" ? cleanTagName(input.name) : "";
	if (!name || name.length > tagNameMaxLength) {
		throw new PersonalTagError(400, "personalTags.invalidName");
	}

	const color = input.color === undefined ? "slate" : input.color;
	if (!isTagColor(color)) {
		throw new PersonalTagError(400, "personalTags.invalidColor");
	}

	return { name, name_key: tagNameKey(name), color };
}

function readItems(input: unknown): TagItem[] {
	if (
		!Array.isArray(input) ||
		input.length === 0 ||
		input.length > tagBatchMaxSize
	) {
		throw new PersonalTagError(400, "personalTags.invalidItems");
	}

	const items = new Map<string, TagItem>();
	for (const item of input) {
		if (!isRecord(item) || !isId(item.itemId)) {
			throw new PersonalTagError(400, "personalTags.invalidItems");
		}
		const kind = tagKinds.find((choice) => choice === item.kind);
		if (!kind) {
			throw new PersonalTagError(400, "personalTags.invalidItems");
		}
		items.set(`${kind}:${item.itemId}`, { kind, itemId: item.itemId });
	}
	return [...items.values()];
}

export class PersonalTagService {
	private readonly repository = new PersonalTagRepository();

	list(owner: string) {
		return this.repository.snapshot(owner);
	}

	async create(owner: string, input: unknown) {
		if (!isRecord(input)) {
			throw new PersonalTagError(400, "general.invalidRoute");
		}
		const fields = readTagFields(input);
		const items = input.items === undefined ? [] : readItems(input.items);
		await databaseTransaction(async (manager) => {
			await this.assertUniqueName(manager, owner, fields.name_key);
			if (items.length) await this.assertTargets(manager, items);
			const tag = await this.repository.create(manager, owner, fields);
			if (items.length) await this.repository.apply(manager, tag.id, items);
		});
		return this.list(owner);
	}

	async update(owner: string, tagId: number, input: unknown) {
		this.assertId(tagId);
		if (
			!isRecord(input) ||
			(input.name === undefined && input.color === undefined)
		) {
			throw new PersonalTagError(400, "general.invalidRoute");
		}
		await databaseTransaction(async (manager) => {
			const tag = await this.requireOwned(manager, owner, tagId);
			const fields = readTagFields({
				name: input.name === undefined ? tag.name : input.name,
				color: input.color === undefined ? tag.color : input.color,
			});
			await this.assertUniqueName(manager, owner, fields.name_key, tagId);
			await this.repository.update(manager, owner, tagId, fields);
		});
		return this.list(owner);
	}

	async delete(owner: string, tagId: number) {
		this.assertId(tagId);
		await databaseTransaction(async (manager) => {
			await this.requireOwned(manager, owner, tagId);
			await this.repository.delete(manager, owner, tagId);
		});
		return this.list(owner);
	}

	async changeAssignments(owner: string, tagId: number, input: unknown) {
		this.assertId(tagId);
		if (
			!isRecord(input) ||
			(input.action !== "apply" && input.action !== "remove")
		) {
			throw new PersonalTagError(400, "general.invalidRoute");
		}
		const { action } = input;
		const items = readItems(input.items);
		await databaseTransaction(async (manager) => {
			await this.requireOwned(manager, owner, tagId);
			await this.assertTargets(manager, items);
			if (action === "apply") {
				await this.repository.apply(manager, tagId, items);
			} else {
				await this.repository.remove(manager, tagId, items);
			}
		});
		return this.list(owner);
	}

	private assertId(id: number) {
		if (!isId(id)) throw new PersonalTagError(400, "general.invalidRoute");
	}

	private async requireOwned(
		manager: EntityManager,
		owner: string,
		id: number,
	) {
		const tag = await this.repository.findOwned(manager, owner, id);
		if (!tag) throw new PersonalTagError(404, "personalTags.notFound");
		return tag;
	}

	private async assertUniqueName(
		manager: EntityManager,
		owner: string,
		key: string,
		exceptId?: number,
	) {
		const existing = await this.repository.findByName(manager, owner, key);
		if (existing && existing.id !== exceptId) {
			throw new PersonalTagError(409, "personalTags.duplicate");
		}
	}

	private async assertTargets(manager: EntityManager, items: TagItem[]) {
		if (!(await this.repository.hasTargets(manager, items))) {
			throw new PersonalTagError(404, "personalTags.itemNotFound");
		}
	}
}
