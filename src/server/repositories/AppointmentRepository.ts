import { Brackets, type EntityManager, type SelectQueryBuilder } from "typeorm";
import { config } from "../config";
import { AppDataSource } from "../db/data-source";
import { AppointmentEntity } from "../entities/AppointmentEntity";
import type {
	Appointment,
	AppointmentWithSlot,
	CalDAVErrorBreakdown,
	CalDAVQueueItem,
	CalDAVQueueSummary,
	CreateAppointmentInput,
} from "../types";
import {
	emptyCalDAVErrorBreakdown,
	normalizeCalDAVSyncPolicy,
} from "../utils/caldavSync";
import { generateUniqueSlugId } from "../utils/slug";

const APPOINTMENT_SELECT_COLUMNS: string[] = [
	"a.id as id",
	"a.slot_id as slot_id",
	"a.name as name",
	"a.email as email",
	"a.meeting_place as meeting_place",
	"a.note as note",
	"COALESCE(a.start_at, s.start_at) as start_at",
	"COALESCE(a.end_at, s.end_at) as end_at",
	"a.slug_id as slug_id",
	"a.status as status",
	"a.canceled_at as canceled_at",
	"a.canceled_by as canceled_by",
	"a.caldav_uid as caldav_uid",
	"a.caldav_calendar_url as caldav_calendar_url",
	"a.caldav_href as caldav_href",
	"a.caldav_etag as caldav_etag",
	"a.caldav_last_synced_at as caldav_last_synced_at",
	"a.caldav_sync_error as caldav_sync_error",
	"a.caldav_error_category as caldav_error_category",
	"a.caldav_error_retryable as caldav_error_retryable",
	"a.caldav_retry_count as caldav_retry_count",
	"a.caldav_next_retry_at as caldav_next_retry_at",
	"a.caldav_conflict_count as caldav_conflict_count",
	"a.caldav_last_conflict_at as caldav_last_conflict_at",
	"a.caldav_conflict_state as caldav_conflict_state",
	"a.caldav_conflict_detail as caldav_conflict_detail",
	"a.caldav_remote_etag as caldav_remote_etag",
	"a.caldav_queue_status as caldav_queue_status",
	"a.caldav_queued_at as caldav_queued_at",
	"a.caldav_sync_policy as caldav_sync_policy",
	"a.created_at as created_at",
];

export class AppointmentRepository {
	private normalizeAppointmentRow(
		row: AppointmentWithSlot,
	): AppointmentWithSlot {
		const normalizedCategory =
			row.caldav_error_category === "auth" ||
			row.caldav_error_category === "network" ||
			row.caldav_error_category === "conflict" ||
			row.caldav_error_category === "validation" ||
			row.caldav_error_category === "calendar" ||
			row.caldav_error_category === "unknown"
				? row.caldav_error_category
				: null;

		const normalizedQueueStatus =
			row.caldav_queue_status === "idle" ||
			row.caldav_queue_status === "syncing" ||
			row.caldav_queue_status === "retryable" ||
			row.caldav_queue_status === "failed"
				? row.caldav_queue_status
				: null;

		return {
			...row,
			caldav_error_category: normalizedCategory,
			caldav_error_retryable:
				row.caldav_error_retryable === null ||
				row.caldav_error_retryable === undefined
					? null
					: Boolean(Number(row.caldav_error_retryable)),
			caldav_retry_count:
				row.caldav_retry_count === null || row.caldav_retry_count === undefined
					? null
					: Number(row.caldav_retry_count),
			caldav_conflict_count: Number(row.caldav_conflict_count ?? 0),
			caldav_conflict_state:
				row.caldav_conflict_state === "detected" ? "detected" : null,
			caldav_queue_status: normalizedQueueStatus,
			caldav_sync_policy: row.caldav_sync_policy
				? normalizeCalDAVSyncPolicy(row.caldav_sync_policy)
				: null,
		};
	}

	private repo(manager?: EntityManager) {
		return manager
			? manager.getRepository(AppointmentEntity)
			: AppDataSource.getRepository(AppointmentEntity);
	}

	private createAppointmentWithSlotQuery(manager?: EntityManager) {
		return this.repo(manager)
			.createQueryBuilder("a")
			.leftJoin("availability_slots", "s", "s.id = a.slot_id")
			.select(APPOINTMENT_SELECT_COLUMNS);
	}

	private applyCalDAVSyncCandidateFilter(
		query: SelectQueryBuilder<AppointmentEntity>,
	) {
		const now = new Date().toISOString();
		const maxRetries = config.caldav.retryMaxAttempts;

		return query.where(
			new Brackets((outer) => {
				outer
					.where(
						new Brackets((approved) => {
							approved
								.where("a.status = 'approved'")
								.andWhere("a.canceled_at IS NULL")
								.andWhere("a.end_at >= :now", { now })
								.andWhere(
									new Brackets((retryableApproved) => {
										retryableApproved
											.where("a.caldav_uid IS NULL OR a.caldav_href IS NULL")
											.orWhere(
												new Brackets((failedApproved) => {
													failedApproved
														.where(
															"TRIM(COALESCE(a.caldav_sync_error, '')) != ''",
														)
														.andWhere(
															"(a.caldav_error_retryable IS NULL OR a.caldav_error_retryable = :retryable)",
															{ retryable: true },
														)
														.andWhere(
															"(a.caldav_retry_count IS NULL OR a.caldav_retry_count < :maxRetries)",
															{ maxRetries },
														)
														.andWhere(
															"(a.caldav_next_retry_at IS NULL OR a.caldav_next_retry_at <= :now)",
															{ now },
														);
												}),
											);
									}),
								);
						}),
					)
					.orWhere(
						new Brackets((canceled) => {
							canceled
								.where("a.canceled_at IS NOT NULL")
								.andWhere("a.caldav_uid IS NOT NULL")
								.andWhere("TRIM(COALESCE(a.caldav_sync_error, '')) != ''")
								.andWhere(
									"(a.caldav_error_retryable IS NULL OR a.caldav_error_retryable = :retryable)",
									{ retryable: true },
								)
								.andWhere(
									"(a.caldav_retry_count IS NULL OR a.caldav_retry_count < :maxRetries)",
									{ maxRetries },
								)
								.andWhere(
									"(a.caldav_next_retry_at IS NULL OR a.caldav_next_retry_at <= :now)",
									{ now },
								);
						}),
					);
			}),
		);
	}

	async findAll(options?: {
		status?: "pending" | "approved" | "rejected" | "all";
	}): Promise<AppointmentWithSlot[]> {
		const query = this.createAppointmentWithSlotQuery();

		if (options?.status && options.status !== "all") {
			query.andWhere("a.status = :status", { status: options.status });
		}

		const rows = await query
			.orderBy("a.created_at", "DESC")
			.getRawMany<AppointmentWithSlot>();

		return rows.map((row) => this.normalizeAppointmentRow(row));
	}

	async findById(id: number): Promise<AppointmentWithSlot | null> {
		const row = await this.createAppointmentWithSlotQuery()
			.where("a.id = :id", { id })
			.getRawOne<AppointmentWithSlot>();

		return row ? this.normalizeAppointmentRow(row) : null;
	}

	async hasOverlapInSlot(
		slotId: number,
		startAt: string,
		endAt: string,
		manager?: EntityManager,
	): Promise<boolean> {
		const count = await this.repo(manager)
			.createQueryBuilder("a")
			.where("a.slot_id = :slotId", { slotId })
			.andWhere("a.canceled_at IS NULL")
			.andWhere("a.status != 'rejected'")
			.andWhere("NOT (a.end_at <= :startAt OR a.start_at >= :endAt)", {
				startAt,
				endAt,
			})
			.getCount();

		return count > 0;
	}

	async findActiveIntervalsBySlotIds(
		slotIds: number[],
		manager?: EntityManager,
	): Promise<Array<{ slot_id: number; start_at: string; end_at: string }>> {
		if (slotIds.length === 0) {
			return [];
		}

		return this.repo(manager)
			.createQueryBuilder("a")
			.select([
				"a.slot_id as slot_id",
				"a.start_at as start_at",
				"a.end_at as end_at",
			])
			.where("a.slot_id IN (:...slotIds)", { slotIds })
			.andWhere("a.canceled_at IS NULL")
			.andWhere("a.status != 'rejected'")
			.andWhere("a.end_at >= :now", { now: new Date().toISOString() })
			.orderBy("a.start_at", "ASC")
			.getRawMany<{ slot_id: number; start_at: string; end_at: string }>();
	}

	async create(
		input: CreateAppointmentInput,
		manager?: EntityManager,
	): Promise<Appointment> {
		const repo = this.repo(manager);
		const slugId = await generateUniqueSlugId(async (candidate) => {
			const existing = await repo.findOne({ where: { slug_id: candidate } });
			return Boolean(existing);
		});
		const created = repo.create({
			slot_id: input.slot_id,
			name: input.name,
			email: input.email || null,
			meeting_place: input.meeting_place || null,
			note: input.note || null,
			start_at: input.start_at,
			end_at: input.end_at,
			slug_id: slugId,
			status: input.status || "approved",
			canceled_at: null,
			canceled_by: null,
			caldav_uid: null,
			caldav_calendar_url: null,
			caldav_href: null,
			caldav_etag: null,
			caldav_last_synced_at: null,
			caldav_sync_error: null,
			caldav_error_category: null,
			caldav_error_retryable: null,
			caldav_retry_count: null,
			caldav_next_retry_at: null,
			caldav_conflict_count: 0,
			caldav_last_conflict_at: null,
			caldav_conflict_state: null,
			caldav_conflict_detail: null,
			caldav_remote_etag: null,
			caldav_queue_status: null,
			caldav_queued_at: null,
			caldav_sync_policy: null,
		});
		const saved = await repo.save(created);
		const normalizedCategory =
			saved.caldav_error_category === "auth" ||
			saved.caldav_error_category === "network" ||
			saved.caldav_error_category === "conflict" ||
			saved.caldav_error_category === "validation" ||
			saved.caldav_error_category === "calendar" ||
			saved.caldav_error_category === "unknown"
				? saved.caldav_error_category
				: null;
		const normalizedQueueStatus =
			saved.caldav_queue_status === "idle" ||
			saved.caldav_queue_status === "syncing" ||
			saved.caldav_queue_status === "retryable" ||
			saved.caldav_queue_status === "failed"
				? saved.caldav_queue_status
				: null;
		const normalizedSyncPolicy = saved.caldav_sync_policy
			? normalizeCalDAVSyncPolicy(saved.caldav_sync_policy)
			: null;
		return {
			id: saved.id,
			slot_id: saved.slot_id,
			name: saved.name,
			email: saved.email,
			meeting_place: saved.meeting_place,
			note: saved.note,
			start_at: saved.start_at || input.start_at,
			end_at: saved.end_at || input.end_at,
			slug_id: saved.slug_id,
			status: saved.status,
			canceled_at: saved.canceled_at,
			canceled_by: saved.canceled_by,
			caldav_uid: saved.caldav_uid,
			caldav_calendar_url: saved.caldav_calendar_url,
			caldav_href: saved.caldav_href,
			caldav_etag: saved.caldav_etag,
			caldav_last_synced_at: saved.caldav_last_synced_at,
			caldav_sync_error: saved.caldav_sync_error,
			caldav_error_category: normalizedCategory,
			caldav_error_retryable: saved.caldav_error_retryable,
			caldav_retry_count: saved.caldav_retry_count,
			caldav_next_retry_at: saved.caldav_next_retry_at,
			caldav_conflict_count: saved.caldav_conflict_count,
			caldav_last_conflict_at: saved.caldav_last_conflict_at,
			caldav_conflict_state:
				saved.caldav_conflict_state === "detected" ? "detected" : null,
			caldav_conflict_detail: saved.caldav_conflict_detail,
			caldav_remote_etag: saved.caldav_remote_etag,
			caldav_queue_status: normalizedQueueStatus,
			caldav_queued_at: saved.caldav_queued_at,
			caldav_sync_policy: normalizedSyncPolicy,
			created_at: saved.created_at,
		};
	}

	async findBySlugId(slugId: string): Promise<AppointmentWithSlot | null> {
		const row = await this.createAppointmentWithSlotQuery()
			.where("a.slug_id = :slugId", { slugId })
			.getRawOne<AppointmentWithSlot>();

		return row ? this.normalizeAppointmentRow(row) : null;
	}

	async markCancelled(
		id: number,
		canceledBy: "admin" | "guest",
	): Promise<AppointmentWithSlot | null> {
		await this.repo().update(id, {
			canceled_at: new Date().toISOString(),
			canceled_by: canceledBy,
		});
		return this.findById(id);
	}

	async updateStatus(
		id: number,
		status: "pending" | "approved" | "rejected",
	): Promise<AppointmentWithSlot | null> {
		await this.repo().update(id, { status });
		return this.findById(id);
	}

	async markCancelledBySlugId(
		slugId: string,
		canceledBy: "admin" | "guest",
	): Promise<AppointmentWithSlot | null> {
		await this.repo().update(
			{ slug_id: slugId },
			{
				canceled_at: new Date().toISOString(),
				canceled_by: canceledBy,
			},
		);
		return this.findBySlugId(slugId);
	}

	async delete(id: number): Promise<boolean> {
		const result = await this.repo().delete(id);
		return !!result.affected;
	}

	async deleteBySlugId(slugId: string): Promise<boolean> {
		const result = await this.repo().delete({ slug_id: slugId });
		return !!result.affected;
	}

	async updateCalDAVMetadata(
		id: number,
		payload: Partial<
			Pick<
				AppointmentEntity,
				| "caldav_uid"
				| "caldav_calendar_url"
				| "caldav_href"
				| "caldav_etag"
				| "caldav_last_synced_at"
				| "caldav_sync_error"
				| "caldav_error_category"
				| "caldav_error_retryable"
				| "caldav_retry_count"
				| "caldav_next_retry_at"
				| "caldav_conflict_count"
				| "caldav_last_conflict_at"
				| "caldav_conflict_state"
				| "caldav_conflict_detail"
				| "caldav_remote_etag"
				| "caldav_queue_status"
				| "caldav_queued_at"
				| "caldav_sync_policy"
			>
		>,
	): Promise<AppointmentWithSlot | null> {
		await this.repo().update(id, payload);
		return this.findById(id);
	}

	async findCalDAVSyncCandidates(
		limit: number,
	): Promise<AppointmentWithSlot[]> {
		const query = this.applyCalDAVSyncCandidateFilter(
			this.createAppointmentWithSlotQuery(),
		)
			.orderBy("a.caldav_last_synced_at", "ASC", "NULLS FIRST")
			.addOrderBy("a.created_at", "ASC")
			.limit(limit);

		const rows = await query.getRawMany<AppointmentWithSlot>();
		return rows.map((row) => this.normalizeAppointmentRow(row));
	}

	async countCalDAVFailedAppointments(): Promise<number> {
		return this.repo()
			.createQueryBuilder("a")
			.where("TRIM(COALESCE(a.caldav_sync_error, '')) != ''")
			.getCount();
	}

	async countCalDAVUnsyncedApprovedAppointments(): Promise<number> {
		const now = new Date().toISOString();
		return this.repo()
			.createQueryBuilder("a")
			.where("a.status = 'approved'")
			.andWhere("a.canceled_at IS NULL")
			.andWhere("a.end_at >= :now", { now })
			.andWhere("(a.caldav_uid IS NULL OR a.caldav_href IS NULL)")
			.getCount();
	}

	async countCalDAVRetryableAppointments(): Promise<number> {
		return this.applyCalDAVSyncCandidateFilter(
			this.repo().createQueryBuilder("a"),
		).getCount();
	}

	async countCalDAVErrorsByCategory(): Promise<CalDAVErrorBreakdown> {
		const rows = await this.repo()
			.createQueryBuilder("a")
			.select("a.caldav_error_category", "category")
			.addSelect("COUNT(*)", "count")
			.where("TRIM(COALESCE(a.caldav_sync_error, '')) != ''")
			.groupBy("a.caldav_error_category")
			.getRawMany<{ category: string | null; count: string }>();

		const breakdown = emptyCalDAVErrorBreakdown();
		for (const row of rows) {
			const category = row.category;
			const count = Number.parseInt(row.count, 10) || 0;
			if (
				category === "auth" ||
				category === "network" ||
				category === "conflict" ||
				category === "validation" ||
				category === "calendar" ||
				category === "unknown"
			) {
				breakdown[category] = count;
			}
		}

		return breakdown;
	}

	async getCalDAVQueueSummary(): Promise<CalDAVQueueSummary> {
		const rows = await this.repo()
			.createQueryBuilder("a")
			.select("COALESCE(a.caldav_queue_status, 'idle')", "status")
			.addSelect("COUNT(*)", "count")
			.where("a.caldav_queue_status IS NOT NULL")
			.groupBy("a.caldav_queue_status")
			.getRawMany<{ status: string; count: string }>();

		const summary: CalDAVQueueSummary = {
			idle: 0,
			syncing: 0,
			retryable: 0,
			failed: 0,
			total: 0,
		};

		for (const row of rows) {
			const count = Number.parseInt(row.count, 10) || 0;
			if (
				row.status === "idle" ||
				row.status === "syncing" ||
				row.status === "retryable" ||
				row.status === "failed"
			) {
				summary[row.status] = count;
				summary.total += count;
			}
		}

		return summary;
	}

	async findCalDAVQueueItems(limit: number): Promise<CalDAVQueueItem[]> {
		return this.repo()
			.createQueryBuilder("a")
			.select([
				"a.id as appointment_id",
				"a.slug_id as slug_id",
				"a.name as name",
				"a.caldav_queue_status as status",
				"COALESCE(a.caldav_retry_count, 0) as retry_count",
				"a.caldav_next_retry_at as next_retry_at",
				"a.caldav_error_category as error_category",
				"a.caldav_sync_error as error_message",
				"a.caldav_queued_at as queued_at",
				"a.caldav_last_synced_at as last_synced_at",
				"a.caldav_conflict_state as conflict_state",
				"a.caldav_conflict_detail as conflict_detail",
				"a.caldav_etag as local_etag",
				"a.caldav_remote_etag as remote_etag",
				"a.caldav_last_conflict_at as conflict_detected_at",
				"COALESCE(a.caldav_conflict_count, 0) as conflict_count",
			])
			.where("a.caldav_queue_status IS NOT NULL")
			.andWhere("a.caldav_queue_status != 'idle'")
			.orderBy("a.caldav_queued_at", "DESC", "NULLS LAST")
			.limit(limit)
			.getRawMany<
				CalDAVQueueItem & {
					conflict_state: string | null;
					conflict_detail: string | null;
					local_etag: string | null;
					remote_etag: string | null;
					conflict_detected_at: string | null;
					conflict_count: string;
				}
			>()
			.then((rows) =>
				rows.map((row) => ({
					appointment_id: Number(row.appointment_id),
					slug_id: row.slug_id,
					name: row.name,
					status: row.status,
					retry_count: Number(row.retry_count ?? 0),
					next_retry_at: row.next_retry_at,
					error_category:
						row.error_category === "auth" ||
						row.error_category === "network" ||
						row.error_category === "conflict" ||
						row.error_category === "validation" ||
						row.error_category === "calendar" ||
						row.error_category === "unknown"
							? row.error_category
							: null,
					error_message: row.error_message,
					queued_at: row.queued_at,
					last_synced_at: row.last_synced_at,
					conflict:
						row.conflict_state === "detected"
							? {
									state: "detected",
									detail: row.conflict_detail,
									local_etag: row.local_etag,
									remote_etag: row.remote_etag,
									detected_at: row.conflict_detected_at,
									count: Number.parseInt(row.conflict_count, 10) || 0,
								}
							: null,
					available_actions:
						row.conflict_state === "detected"
							? ["retry", "refresh_etag", "force_overwrite"]
							: ["retry"],
				})),
			);
	}

	async countBySlotId(slotId: number): Promise<number> {
		return this.repo().count({ where: { slot_id: slotId } });
	}
}
