import { and, eq, inArray } from 'drizzle-orm';
import {
	assignedModules,
	db,
	programs,
	semesterModules,
	structureSemesters,
	structures,
	users,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class AssignedModuleRepository extends BaseRepository<
	typeof assignedModules,
	'id'
> {
	constructor() {
		super(assignedModules, assignedModules.id);
	}

	override async findById(id: number) {
		const result = await db.query.assignedModules.findFirst({
			where: eq(assignedModules.id, id),
			with: {
				semesterModule: {
					with: {
						module: true,
						semester: {
							with: {
								structure: {
									with: {
										program: {
											with: {
												school: true,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		});
		return result ?? null;
	}

	async removeModuleAssignments(userId: string, semesterModuleIds: number[]) {
		if (semesterModuleIds.length === 0) return;

		return db
			.delete(assignedModules)
			.where(
				and(
					eq(assignedModules.userId, userId),
					inArray(assignedModules.semesterModuleId, semesterModuleIds)
				)
			);
	}

	async createMany(data: (typeof assignedModules.$inferInsert)[]) {
		if (data.length === 0) return [];

		return db.insert(assignedModules).values(data).returning();
	}

	async findByUserAndModule(userId: string, moduleId: number) {
		const results = await db.query.assignedModules.findMany({
			where: and(
				eq(assignedModules.userId, userId),
				eq(assignedModules.active, true)
			),
			with: {
				semesterModule: {
					with: {
						module: true,
						semester: {
							with: {
								structure: {
									with: {
										program: {
											with: {
												school: true,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		});

		return results.filter((item) => item.semesterModule?.moduleId === moduleId);
	}
	async findByModule(moduleId: number) {
		const results = await db
			.select({
				id: users.id,
				name: users.name,
				position: users.position,
				image: users.image,
				programCode: programs.code,
				semesterName: structureSemesters.name,
			})
			.from(assignedModules)
			.innerJoin(users, eq(assignedModules.userId, users.id))
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
			.where(eq(semesterModules.moduleId, moduleId));
		const groupedResults = new Map<
			string,
			{
				id: string;
				name: string | null;
				position: string | null;
				image: string | null;
				assignments: Array<{ programCode: string; semesterName: string }>;
			}
		>();

		for (const result of results) {
			if (!groupedResults.has(result.id)) {
				groupedResults.set(result.id, {
					id: result.id,
					name: result.name,
					position: result.position,
					image: result.image,
					assignments: [],
				});
			}

			const lecturer = groupedResults.get(result.id)!;
			lecturer.assignments.push({
				programCode: result.programCode,
				semesterName: result.semesterName,
			});
		}

		return Array.from(groupedResults.values());
	}

	async findByUser(userId: string) {
		return await db.query.assignedModules.findMany({
			where: and(
				eq(assignedModules.userId, userId),
				eq(assignedModules.active, true)
			),
			with: {
				semesterModule: {
					with: {
						module: true,
						semester: {
							with: {
								structure: {
									with: {
										program: {
											with: {
												school: true,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		});
	}

	async linkCourseToAssignment(
		userId: string,
		semesterModuleId: number,
		lmsCourseId: string
	) {
		return await db
			.update(assignedModules)
			.set({ lmsCourseId })
			.where(
				and(
					eq(assignedModules.userId, userId),
					eq(assignedModules.semesterModuleId, semesterModuleId),
					eq(assignedModules.active, true)
				)
			)
			.returning();
	}

	async getUserCourseIds(userId: string) {
		const results = await db
			.select({ courseId: assignedModules.lmsCourseId })
			.from(assignedModules)
			.where(
				and(
					eq(assignedModules.userId, userId),
					eq(assignedModules.active, true)
				)
			);

		return results
			.map((r) => r.courseId)
			.filter((id): id is string => id !== null);
	}

	async findByLmsCourseId(lmsCourseId: string) {
		return await db.query.assignedModules.findFirst({
			where: eq(assignedModules.lmsCourseId, lmsCourseId),
			with: {
				semesterModule: {
					with: {
						module: true,
						semester: {
							with: {
								structure: {
									with: {
										program: {
											with: {
												school: true,
											},
										},
									},
								},
							},
						},
					},
				},
				term: true,
			},
		});
	}
}

export const assignedModulesRepository = new AssignedModuleRepository();
