import { and, count, desc, eq, inArray, like, or, type SQL } from 'drizzle-orm';
import {
	db,
	type Grade,
	modulePrerequisites,
	modules,
	programs,
	schools,
	semesterModules,
	structureSemesters,
	structures,
	studentModules,
	studentPrograms,
	studentSemesters,
	terms,
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
		studentCount?: number;
	}>;
};

export type ModuleGradeData = {
	id: number;
	moduleId: number;
	stdNo: number;
	grade: Grade;
	weightedTotal: number;
	createdAt: Date | null;
	updatedAt: Date | null;
};

export type ModuleGradeInsert = {
	moduleId: number;
	stdNo: number;
	grade: Grade;
	weightedTotal: number;
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
		const activeTerm = await db.query.terms.findFirst({
			where: eq(terms.isActive, true),
			columns: { code: true },
		});

		if (!activeTerm) {
			return [];
		}

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
				studentCount: count(studentSemesters.id),
			})
			.from(semesterModules)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.innerJoin(
				structureSemesters,
				eq(semesterModules.semesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(structureSemesters.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.leftJoin(
				studentModules,
				eq(studentModules.semesterModuleId, semesterModules.id)
			)
			.leftJoin(
				studentSemesters,
				and(
					eq(studentSemesters.id, studentModules.studentSemesterId),
					eq(studentSemesters.term, activeTerm.code)
				)
			)
			.where(
				search
					? or(
							like(modules.code, `%${search}%`),
							like(modules.name, `%${search}%`)
						)
					: undefined
			)
			.groupBy(
				semesterModules.id,
				semesterModules.semesterId,
				modules.code,
				modules.name,
				modules.id,
				structureSemesters.id,
				structureSemesters.name,
				structureSemesters.structureId,
				programs.id,
				programs.name,
				programs.code
			)
			.orderBy(desc(semesterModules.id))
			.limit(50);

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
				studentCount: it.studentCount,
			});
		}
		return Array.from(groupedModules.values());
	}

	async getStudentCountForPreviousSemester(semesterModuleId: number) {
		const semesterModule = await db.query.semesterModules.findFirst({
			where: eq(semesterModules.id, semesterModuleId),
			with: {
				semester: true,
			},
		});

		if (!semesterModule?.semester) {
			return 0;
		}

		const currentSemesterNumber = Number.parseInt(
			semesterModule.semester.semesterNumber,
			10
		);
		const previousSemesterNumber = currentSemesterNumber - 1;

		if (previousSemesterNumber < 1) {
			return 0;
		}

		const previousSemester = await db.query.structureSemesters.findFirst({
			where: and(
				eq(structureSemesters.structureId, semesterModule.semester.structureId),
				or(
					eq(
						structureSemesters.semesterNumber,
						previousSemesterNumber.toString().padStart(2, '0')
					)
				)
			),
		});

		if (!previousSemester) {
			return 0;
		}

		const studentSemesterTerms = await db
			.selectDistinct({ term: studentSemesters.term })
			.from(studentSemesters)
			.where(eq(studentSemesters.structureSemesterId, previousSemester.id));

		if (studentSemesterTerms.length === 0) {
			return 0;
		}

		const termCodes = studentSemesterTerms.map((t) => t.term);

		const mostRecentTerm = await db.query.terms.findFirst({
			where: inArray(terms.code, termCodes),
			orderBy: [desc(terms.id)],
		});

		if (!mostRecentTerm) {
			return 0;
		}

		const result = await db
			.select({ count: count() })
			.from(studentSemesters)
			.where(
				and(
					eq(studentSemesters.structureSemesterId, previousSemester.id),
					eq(studentSemesters.term, mostRecentTerm.code)
				)
			);

		return result[0]?.count || 0;
	}

	async findGradeByModuleAndStudent(
		moduleId: number,
		stdNo: number
	): Promise<ModuleGradeData | null> {
		const semModules = await db.query.semesterModules.findMany({
			where: eq(semesterModules.moduleId, moduleId),
			columns: { id: true },
		});

		if (semModules.length === 0) return null;

		const semesterModuleIds = semModules.map((sm) => sm.id);

		const allResults = await db.query.studentModules.findMany({
			where: inArray(studentModules.semesterModuleId, semesterModuleIds),
			with: {
				semesterModule: {
					columns: { moduleId: true },
				},
				studentSemester: {
					columns: {},
					with: {
						studentProgram: {
							columns: { stdNo: true },
						},
					},
				},
			},
		});

		const match = allResults.find(
			(sm) => sm.studentSemester?.studentProgram?.stdNo === stdNo
		);

		if (!match) return null;

		return {
			id: match.id,
			moduleId: match.semesterModule?.moduleId ?? moduleId,
			stdNo: match.studentSemester?.studentProgram?.stdNo ?? stdNo,
			grade: match.grade,
			weightedTotal: parseFloat(match.marks) || 0,
			createdAt: match.createdAt,
			updatedAt: match.createdAt,
		};
	}

	async findGradesByModuleId(moduleId: number): Promise<ModuleGradeData[]> {
		const semModules = await db.query.semesterModules.findMany({
			where: eq(semesterModules.moduleId, moduleId),
			columns: { id: true },
		});

		if (semModules.length === 0) return [];

		const semesterModuleIds = semModules.map((sm) => sm.id);

		const results = await db.query.studentModules.findMany({
			where: inArray(studentModules.semesterModuleId, semesterModuleIds),
			with: {
				semesterModule: {
					columns: { moduleId: true },
				},
				studentSemester: {
					columns: {},
					with: {
						studentProgram: {
							columns: { stdNo: true },
						},
					},
				},
			},
		});

		return results.map((sm) => ({
			id: sm.id,
			moduleId: sm.semesterModule?.moduleId ?? moduleId,
			stdNo: sm.studentSemester?.studentProgram?.stdNo ?? 0,
			grade: sm.grade,
			weightedTotal: parseFloat(sm.marks) || 0,
			createdAt: sm.createdAt,
			updatedAt: sm.createdAt,
		}));
	}

	async upsertModuleGrade(data: ModuleGradeInsert): Promise<ModuleGradeData[]> {
		const studentProgram = await db.query.studentPrograms.findFirst({
			where: eq(studentPrograms.stdNo, data.stdNo),
			columns: { id: true },
			with: {
				semesters: {
					columns: { id: true },
					with: {
						studentModules: {
							columns: { id: true, semesterModuleId: true },
							with: {
								semesterModule: {
									columns: { moduleId: true },
								},
							},
						},
					},
				},
			},
		});

		if (!studentProgram) {
			throw new Error(`Student program not found for stdNo: ${data.stdNo}`);
		}

		let studentModuleId: number | null = null;

		for (const semester of studentProgram.semesters) {
			for (const sm of semester.studentModules) {
				if (sm.semesterModule?.moduleId === data.moduleId) {
					studentModuleId = sm.id;
					break;
				}
			}
			if (studentModuleId) break;
		}

		if (!studentModuleId) {
			throw new Error(
				`Student module not found for moduleId: ${data.moduleId} and stdNo: ${data.stdNo}`
			);
		}

		const updated = await db
			.update(studentModules)
			.set({
				grade: data.grade,
				marks: data.weightedTotal.toString(),
			})
			.where(eq(studentModules.id, studentModuleId))
			.returning();

		return updated.map((sm) => ({
			id: sm.id,
			moduleId: data.moduleId,
			stdNo: data.stdNo,
			grade: sm.grade,
			weightedTotal: parseFloat(sm.marks) || 0,
			createdAt: sm.createdAt,
			updatedAt: sm.createdAt,
		}));
	}

	async updateGradeByStudentModuleId(
		studentModuleId: number,
		grade: Grade,
		weightedTotal: number
	) {
		const updated = await db
			.update(studentModules)
			.set({
				grade,
				marks: weightedTotal.toString(),
			})
			.where(eq(studentModules.id, studentModuleId))
			.returning();

		if (updated.length === 0) {
			throw new Error(`Student module not found: ${studentModuleId}`);
		}

		return updated[0];
	}
}

export const modulesRepository = new SemesterModuleRepository();
