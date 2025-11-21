import { and, count, desc, eq, inArray, like, or, type SQL } from 'drizzle-orm';
import {
	db,
	modulePrerequisites,
	modules,
	programs,
	schools,
	semesterModules,
	structureSemesters,
	structures,
	studentSemesters,
} from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

type ModuleInfo = {
	code: string;
	name: string;
	moduleId: number;
	semesters: Array<{
		semesterModuleId: number;
		semesterId: number;
		structureSemesterId: number;
		semesterName: string;
		structureId: number;
		programId: number;
		programName: string;
		programCode: string;
	}>;
};

export default class SemesterModuleRepository extends BaseRepository<
	typeof semesterModules,
	'id'
> {
	constructor() {
		super(semesterModules, semesterModules.id);
	}

	private buildModuleSearchWhere(
		search: string,
		baseWhere?: SQL
	): SQL | undefined {
		const trimmed = search.trim();
		if (!trimmed) return baseWhere;
		const moduleFilter = inArray(
			semesterModules.moduleId,
			db
				.select({ value: modules.id })
				.from(modules)
				.where(
					or(
						like(modules.code, `%${trimmed}%`),
						like(modules.name, `%${trimmed}%`)
					)
				)
		);
		return baseWhere ? and(baseWhere, moduleFilter) : moduleFilter;
	}

	async search(
		options: QueryOptions<typeof semesterModules>,
		searchKey: string
	) {
		const criteria = this.buildQueryCriteria(options);

		const where = this.buildModuleSearchWhere(searchKey, criteria.where);

		const data = await db.query.semesterModules.findMany({
			...criteria,
			where,
			with: {
				module: true,
			},
		});

		return this.createPaginatedResult(data, criteria);
	}

	override async findById(id: number) {
		return db.query.semesterModules.findFirst({
			where: eq(semesterModules.id, id),
			with: {
				module: true,
				semester: {
					with: {
						structure: true,
					},
				},
			},
		});
	}

	async findByCode(code: string) {
		return db
			.select({
				id: semesterModules.id,
				moduleId: semesterModules.moduleId,
				type: semesterModules.type,
				credits: semesterModules.credits,
				semesterId: semesterModules.semesterId,
				hidden: semesterModules.hidden,
				code: modules.code,
				name: modules.name,
			})
			.from(semesterModules)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(eq(modules.code, code))
			.limit(1)
			.then((rows) => rows[0] || null);
	}

	async findModulesByStructure(structureId: number, search = '') {
		const data = await db.query.structureSemesters.findMany({
			where: eq(structureSemesters.structureId, structureId),
			with: {
				semesterModules: {
					with: {
						module: true,
					},
					where: this.buildModuleSearchWhere(search),
				},
			},
			orderBy: structureSemesters.semesterNumber,
		});
		return data.flatMap((it) => it.semesterModules);
	}

	async addPrerequisite(semesterModuleId: number, prerequisiteId: number) {
		return db.insert(modulePrerequisites).values({
			semesterModuleId,
			prerequisiteId,
		});
	}

	async clearPrerequisites(semesterModuleId: number) {
		return db
			.delete(modulePrerequisites)
			.where(eq(modulePrerequisites.semesterModuleId, semesterModuleId));
	}

	async getPrerequisites(semesterModuleId: number) {
		return db
			.select({
				id: semesterModules.id,
				moduleId: semesterModules.moduleId,
				type: semesterModules.type,
				credits: semesterModules.credits,
				code: modules.code,
				name: modules.name,
			})
			.from(modulePrerequisites)
			.innerJoin(
				semesterModules,
				eq(semesterModules.id, modulePrerequisites.prerequisiteId)
			)
			.innerJoin(modules, eq(modules.id, semesterModules.moduleId))
			.where(eq(modulePrerequisites.semesterModuleId, semesterModuleId))
			.orderBy(modules.code);
	}

	async getModulesByStructure(structureId: number) {
		const semesters = await db
			.select({
				id: structureSemesters.id,
				semesterNumber: structureSemesters.semesterNumber,
				name: structureSemesters.name,
				totalCredits: structureSemesters.totalCredits,
			})
			.from(structureSemesters)
			.where(eq(structureSemesters.structureId, structureId))
			.orderBy(structureSemesters.semesterNumber);

		const semestersWithModules = await Promise.all(
			semesters.map(async (semester) => {
				const modulesList = await db
					.select({
						moduleId: semesterModules.id,
						type: semesterModules.type,
						credits: semesterModules.credits,
						code: modules.code,
						name: modules.name,
					})
					.from(semesterModules)
					.innerJoin(modules, eq(modules.id, semesterModules.moduleId))
					.orderBy(modules.code);

				return {
					...semester,
					modules: modulesList,
				};
			})
		);

		return semestersWithModules;
	}

	async getSchools() {
		return db.select().from(schools).orderBy(schools.id);
	}

	async getProgramsBySchool(schoolId: number) {
		return db
			.select()
			.from(programs)
			.where(eq(programs.schoolId, schoolId))
			.orderBy(programs.code);
	}

	async getStructuresByModule(moduleId: number) {
		return db
			.select({
				id: structures.id,
				code: structures.code,
				programId: programs.id,
				programName: programs.name,
			})
			.from(semesterModules)
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.where(eq(semesterModules.moduleId, moduleId))
			.groupBy(structures.id, structures.code, programs.id, programs.name)
			.orderBy(programs.name, structures.code)
			.limit(20);
	}

	async getStructuresByProgram(programId: number) {
		return db
			.select()
			.from(structures)
			.where(eq(structures.programId, programId))
			.orderBy(desc(structures.id));
	}

	async getModulesForStructure(structureId: number) {
		return await db.query.structureSemesters.findMany({
			where: eq(structureSemesters.structureId, structureId),
			with: {
				semesterModules: {
					with: {
						module: true,
					},
				},
			},
		});
	}

	async searchModulesWithDetails(search = '') {
		const results = await db
			.select({
				semesterModuleId: semesterModules.id,
				semesterId: semesterModules.semesterId,
				code: modules.code,
				name: modules.name,
				moduleId: modules.id,
				structureSemesterId: structureSemesters.id,
				semesterName: structureSemesters.name,
				structureId: structureSemesters.structureId,
				programId: programs.id,
				programName: programs.name,
				programCode: programs.code,
			})
			.from(semesterModules)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.where(
				and(
					search
						? or(
								like(modules.code, `%${search}%`),
								like(modules.name, `%${search}%`)
							)
						: undefined
				)
			)
			.orderBy(desc(semesterModules.id));

		const groupedModules = new Map<string, ModuleInfo>();
		for (const it of results) {
			const key = `${it.code}-${it.name}`;

			if (!groupedModules.has(key)) {
				groupedModules.set(key, {
					code: it.code,
					name: it.name,
					moduleId: it.moduleId,
					semesters: [],
				});
			}

			groupedModules.get(key)?.semesters.push({
				semesterModuleId: it.semesterModuleId,
				semesterId: it.semesterId!,
				structureSemesterId: it.structureSemesterId,
				semesterName: it.semesterName,
				structureId: it.structureId,
				programId: it.programId,
				programName: it.programName,
				programCode: it.programCode,
			});
		}
		return Array.from(groupedModules.values());
	}
	async getStudentCountForPreviousSemester(semesterModuleId: number) {
		const currentModule = await db.query.semesterModules.findFirst({
			where: eq(semesterModules.id, semesterModuleId),
			with: {
				semester: true,
			},
		});

		if (!currentModule || !currentModule.semester) return 0;

		const currentSemesterNumber = parseInt(
			currentModule.semester.semesterNumber
		);
		if (Number.isNaN(currentSemesterNumber) || currentSemesterNumber <= 1)
			return 0;

		const prevSemesterNumber = currentSemesterNumber - 1;
		const structureId = currentModule.semester.structureId;

		const allSemesters = await db.query.structureSemesters.findMany({
			where: eq(structureSemesters.structureId, structureId),
		});

		const prevSemester = allSemesters.find(
			(s) => parseInt(s.semesterNumber) === prevSemesterNumber
		);

		if (!prevSemester) return 0;

		const prevStructureSemesterId = prevSemester.id;

		const latestTermEntry = await db
			.select({ term: studentSemesters.term })
			.from(studentSemesters)
			.where(eq(studentSemesters.structureSemesterId, prevStructureSemesterId))
			.orderBy(desc(studentSemesters.createdAt))
			.limit(1);

		if (latestTermEntry.length === 0) return 0;

		const latestTerm = latestTermEntry[0].term;

		const result = await db
			.select({ count: count() })
			.from(studentSemesters)
			.where(
				and(
					eq(studentSemesters.structureSemesterId, prevStructureSemesterId),
					eq(studentSemesters.term, latestTerm)
				)
			);

		return result[0].count;
	}
}

export const modulesRepository = new SemesterModuleRepository();
