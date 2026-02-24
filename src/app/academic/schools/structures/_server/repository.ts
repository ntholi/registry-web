import { eq } from 'drizzle-orm';
import { db, structureSemesters, structures } from '@/core/database';
import { auditLogs } from '@/core/database/schema/auditLogs';
import BaseRepository, {
	type AuditOptions,
} from '@/core/platform/BaseRepository';

export default class StructureRepository extends BaseRepository<
	typeof structures,
	'id'
> {
	constructor() {
		super(structures, structures.id);
	}

	async findByProgramId(programId: number) {
		return db.query.structures.findMany({
			where: () => eq(structures.programId, programId),
			columns: {
				id: true,
				code: true,
				desc: true,
			},
			orderBy: (structures, { asc }) => [asc(structures.code)],
		});
	}

	override async findById(id: number) {
		const structure = await db.query.structures.findFirst({
			where: () => eq(structures.id, id),
			with: {
				program: {
					with: {
						school: true,
					},
				},
				semesters: {
					with: {
						semesterModules: {
							with: {
								module: true,
								prerequisites: {
									with: {
										prerequisite: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!structure) return null;

		const allPrerequisiteIds = structure.semesters.flatMap((semester) =>
			semester.semesterModules.flatMap((sm) =>
				sm.prerequisites.map((p) => p.prerequisite.moduleId)
			)
		);

		const uniqueModuleIds = [...new Set(allPrerequisiteIds)].filter(
			(id): id is number => id !== null
		);

		if (uniqueModuleIds.length === 0) {
			return structure;
		}

		const prerequisiteModules = await db.query.modules.findMany({
			where: (modules, { inArray }) => inArray(modules.id, uniqueModuleIds),
		});

		const moduleMap = new Map(prerequisiteModules.map((m) => [m.id, m]));

		return {
			...structure,
			semesters: structure.semesters.map((semester) => ({
				...semester,
				semesterModules: semester.semesterModules.map((sm) => ({
					...sm,
					prerequisites: sm.prerequisites.map((p) => ({
						...p,
						prerequisite: {
							...p.prerequisite,
							module: p.prerequisite.moduleId
								? moduleMap.get(p.prerequisite.moduleId) || null
								: null,
						},
					})),
				})),
			})),
		};
	}

	async getStructureModules(structureId: number) {
		const structure = await db.query.structures.findFirst({
			where: () => eq(structures.id, structureId),
			with: {
				semesters: {
					with: {
						semesterModules: {
							where: (semesterModules) => eq(semesterModules.hidden, false),
							with: {
								module: true,
							},
						},
					},
				},
			},
		});

		if (!structure) return [];

		const modules = structure.semesters
			.flatMap((semester) =>
				semester.semesterModules.map((semMod) => ({
					semesterModuleId: semMod.id,
					moduleId: semMod.module?.id,
					code: semMod.module?.code,
					name: semMod.module?.name,
					type: semMod.type,
					credits: semMod.credits,
					semesterNumber: semester.semesterNumber,
				}))
			)
			.filter((mod) => mod.moduleId && mod.code && mod.name);

		return modules;
	}

	async getStructureSemestersByStructureId(structureId: number) {
		return db.query.structureSemesters.findMany({
			where: eq(structureSemesters.structureId, structureId),
			columns: { id: true, name: true, semesterNumber: true },
			orderBy: (sems, { asc }) => [asc(sems.semesterNumber)],
		});
	}

	async createStructureSemester(
		data: typeof structureSemesters.$inferInsert,
		audit?: AuditOptions
	) {
		if (!audit) {
			const [result] = await db
				.insert(structureSemesters)
				.values(data)
				.returning();
			return result;
		}

		return db.transaction(async (tx) => {
			const [result] = await tx
				.insert(structureSemesters)
				.values(data)
				.returning();

			await tx.insert(auditLogs).values({
				tableName: 'structure_semesters',
				recordId: String(result.id),
				operation: 'INSERT',
				oldValues: null,
				newValues: result,
				changedBy: audit.userId,
				metadata: audit.metadata ?? null,
				activityType: audit.activityType ?? null,
			});

			return result;
		});
	}
}

export const structuresRepository = new StructureRepository();
