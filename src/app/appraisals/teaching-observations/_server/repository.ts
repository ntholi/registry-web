import { and, eq, inArray, sql } from 'drizzle-orm';
import {
	assignedModules,
	db,
	feedbackCycles,
	modules,
	observationCategories,
	observationCriteria,
	observationRatings,
	observations,
	programs,
	semesterModules,
	structureSemesters,
	structures,
	users,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export default class ObservationRepository extends BaseRepository<
	typeof observations,
	'id'
> {
	constructor() {
		super(observations, observations.id);
	}

	override async findById(id: string) {
		return db.query.observations.findFirst({
			where: eq(observations.id, id),
			with: {
				cycle: true,
				assignedModule: {
					with: {
						user: true,
						semesterModule: {
							with: {
								module: true,
								semester: {
									with: { structure: { with: { program: true } } },
								},
							},
						},
					},
				},
				observer: true,
				ratings: {
					with: { criterion: { with: { category: true } } },
				},
			},
		});
	}

	async queryObservations(
		options: QueryOptions<typeof observations>,
		filters?: { cycleId?: string; observerId?: string; status?: string }
	) {
		const conditions: ReturnType<typeof eq>[] = [];
		if (filters?.cycleId)
			conditions.push(eq(observations.cycleId, filters.cycleId));
		if (filters?.observerId)
			conditions.push(eq(observations.observerId, filters.observerId));
		if (filters?.status)
			conditions.push(eq(observations.status, filters.status));

		const filter = conditions.length > 0 ? and(...conditions) : undefined;

		const { orderBy, where, offset, limit } = this.buildQueryCriteria({
			...options,
			filter: filter
				? options.filter
					? and(options.filter, filter)
					: filter
				: options.filter,
		});

		const items = await db
			.select({
				id: observations.id,
				status: observations.status,
				createdAt: observations.createdAt,
				submittedAt: observations.submittedAt,
				lecturerName: users.name,
				moduleCode: modules.code,
				moduleName: modules.name,
				programCode: programs.code,
			})
			.from(observations)
			.innerJoin(
				assignedModules,
				eq(observations.assignedModuleId, assignedModules.id)
			)
			.innerJoin(users, eq(assignedModules.userId, users.id))
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.leftJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.leftJoin(structures, eq(structureSemesters.structureId, structures.id))
			.leftJoin(programs, eq(structures.programId, programs.id))
			.orderBy(...orderBy)
			.where(where)
			.limit(limit)
			.offset(offset);

		const totalItems = await this.count(where);
		return {
			items,
			totalPages: Math.ceil(totalItems / (limit || 12)),
			totalItems,
		};
	}

	async createWithRatings(
		data: typeof observations.$inferInsert,
		criterionIds: string[],
		audit?: AuditOptions
	) {
		return db.transaction(async (tx) => {
			const [obs] = await tx.insert(observations).values(data).returning();

			if (criterionIds.length > 0) {
				await tx.insert(observationRatings).values(
					criterionIds.map((criterionId) => ({
						observationId: obs.id,
						criterionId,
						rating: null,
					}))
				);
			}

			if (audit) {
				await this.writeAuditLog(tx, 'INSERT', obs.id, null, obs, audit);
			}

			return obs;
		});
	}

	async updateWithRatings(
		id: string,
		data: Partial<typeof observations.$inferInsert>,
		ratings: Array<{ criterionId: string; rating: number | null }>,
		audit?: AuditOptions
	) {
		return db.transaction(async (tx) => {
			const [old] = await tx
				.select()
				.from(observations)
				.where(eq(observations.id, id));

			const [updated] = await tx
				.update(observations)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(observations.id, id))
				.returning();

			for (const r of ratings) {
				await tx
					.update(observationRatings)
					.set({ rating: r.rating })
					.where(
						and(
							eq(observationRatings.observationId, id),
							eq(observationRatings.criterionId, r.criterionId)
						)
					);
			}

			if (audit && old) {
				await this.writeAuditLog(tx, 'UPDATE', id, old, updated, audit);
			}

			return updated;
		});
	}

	async submit(id: string, audit?: AuditOptions) {
		return db.transaction(async (tx) => {
			const [old] = await tx
				.select()
				.from(observations)
				.where(eq(observations.id, id));

			const [updated] = await tx
				.update(observations)
				.set({
					status: 'submitted',
					submittedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(observations.id, id))
				.returning();

			if (audit && old) {
				await this.writeAuditLog(tx, 'UPDATE', id, old, updated, audit);
			}

			return updated;
		});
	}

	async acknowledge(id: string, comment: string | null, audit?: AuditOptions) {
		return db.transaction(async (tx) => {
			const [old] = await tx
				.select()
				.from(observations)
				.where(eq(observations.id, id));

			const [updated] = await tx
				.update(observations)
				.set({
					status: 'acknowledged',
					acknowledgedAt: new Date(),
					acknowledgmentComment: comment,
					updatedAt: new Date(),
				})
				.where(eq(observations.id, id))
				.returning();

			if (audit && old) {
				await this.writeAuditLog(tx, 'UPDATE', id, old, updated, audit);
			}

			return updated;
		});
	}

	async checkExists(cycleId: string, assignedModuleId: number) {
		const [row] = await db
			.select({ id: observations.id })
			.from(observations)
			.where(
				and(
					eq(observations.cycleId, cycleId),
					eq(observations.assignedModuleId, assignedModuleId)
				)
			)
			.limit(1);
		return row ?? null;
	}

	async findByLecturer(
		userId: string,
		options: QueryOptions<typeof observations>
	) {
		const lecturerFilter = sql`${observations.assignedModuleId} IN (
			SELECT ${assignedModules.id} FROM ${assignedModules}
			WHERE ${assignedModules.userId} = ${userId}
		) AND ${observations.status} IN ('submitted', 'acknowledged')`;

		const { orderBy, where, offset, limit } = this.buildQueryCriteria({
			...options,
			filter: options.filter
				? and(options.filter, lecturerFilter)
				: lecturerFilter,
		});

		const items = await db
			.select({
				id: observations.id,
				status: observations.status,
				createdAt: observations.createdAt,
				submittedAt: observations.submittedAt,
				observerName: sql<string>`observer.name`,
				moduleCode: modules.code,
				moduleName: modules.name,
			})
			.from(observations)
			.innerJoin(
				assignedModules,
				eq(observations.assignedModuleId, assignedModules.id)
			)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				sql`${users} AS observer`,
				eq(observations.observerId, sql`observer.id`)
			)
			.orderBy(...orderBy)
			.where(where)
			.limit(limit)
			.offset(offset);

		const totalItems = await this.count(where);
		return {
			items,
			totalPages: Math.ceil(totalItems / (limit || 12)),
			totalItems,
		};
	}

	async getActiveCycles(schoolIds: number[]) {
		if (schoolIds.length === 0) return [];
		const today = new Date().toISOString().slice(0, 10);
		return db
			.select({
				id: feedbackCycles.id,
				name: feedbackCycles.name,
				termId: feedbackCycles.termId,
			})
			.from(feedbackCycles)
			.where(
				and(
					sql`${feedbackCycles.startDate} <= ${today}`,
					sql`${feedbackCycles.endDate} >= ${today}`,
					sql`${feedbackCycles.id} IN (
						SELECT cycle_id FROM feedback_cycle_schools
						WHERE school_id = ANY(${schoolIds})
					)`
				)
			);
	}

	async getLecturersForSchool(schoolIds: number[], termId: number) {
		if (schoolIds.length === 0) return [];
		return db
			.selectDistinct({
				id: users.id,
				name: users.name,
			})
			.from(users)
			.innerJoin(assignedModules, eq(assignedModules.userId, users.id))
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.where(
				and(
					eq(assignedModules.termId, termId),
					inArray(programs.schoolId, schoolIds)
				)
			)
			.orderBy(users.name);
	}

	async getAssignedModulesForLecturer(userId: string, termId: number) {
		return db
			.select({
				id: assignedModules.id,
				moduleCode: modules.code,
				moduleName: modules.name,
				programCode: programs.code,
			})
			.from(assignedModules)
			.innerJoin(
				semesterModules,
				eq(assignedModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.leftJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.leftJoin(structures, eq(structureSemesters.structureId, structures.id))
			.leftJoin(programs, eq(structures.programId, programs.id))
			.where(
				and(
					eq(assignedModules.userId, userId),
					eq(assignedModules.termId, termId)
				)
			)
			.orderBy(modules.code);
	}

	async getAllCriteria() {
		return db
			.select({
				id: observationCriteria.id,
				text: observationCriteria.text,
				description: observationCriteria.description,
				sortOrder: observationCriteria.sortOrder,
				categoryId: observationCriteria.categoryId,
				categoryName: observationCategories.name,
				section: observationCategories.section,
				categorySortOrder: observationCategories.sortOrder,
			})
			.from(observationCriteria)
			.innerJoin(
				observationCategories,
				eq(observationCriteria.categoryId, observationCategories.id)
			)
			.orderBy(
				observationCategories.section,
				observationCategories.sortOrder,
				observationCriteria.sortOrder
			);
	}
}
