import type { TagSnapshot } from "../../shared/personalTags";
import { t } from "../i18n";
import {
	PersonalTagError,
	PersonalTagService,
} from "../services/PersonalTagService";
import type { ApiResponse } from "../types";

export class PersonalTagController {
	private readonly service = new PersonalTagService();

	list(owner: string) {
		return this.respond(() => this.service.list(owner));
	}

	create(owner: string, body: unknown) {
		return this.respond(() => this.service.create(owner, body), 201);
	}

	update(owner: string, id: number, body: unknown) {
		return this.respond(() => this.service.update(owner, id, body));
	}

	delete(owner: string, id: number) {
		return this.respond(() => this.service.delete(owner, id));
	}

	changeAssignments(owner: string, id: number, body: unknown) {
		return this.respond(() => this.service.changeAssignments(owner, id, body));
	}

	private async respond(
		action: () => Promise<TagSnapshot>,
		status = 200,
	): Promise<{ status: number; body: ApiResponse<TagSnapshot> }> {
		try {
			return { status, body: { success: true, data: await action() } };
		} catch (error) {
			if (error instanceof PersonalTagError) {
				return {
					status: error.status,
					body: { success: false, error: t(error.key) },
				};
			}

			console.error(
				"Personal tag request failed:",
				error instanceof Error ? error.message : error,
			);
			return {
				status: 500,
				body: { success: false, error: t("error.unexpected") },
			};
		}
	}
}
