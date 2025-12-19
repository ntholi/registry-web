import { eq, inArray } from 'drizzle-orm';
import {
	db,
	type Grade,
	semesterModules,
	studentModules,
	studentPrograms,
} from '@/core/database';

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

export default class ModuleGradeRepository {
	async findByModuleAndStudent(
		moduleId: number,
		stdNo: number
	): Promise<ModuleGradeData | null> {
		const semModules = await db.query.semesterModules.findMany({
			where: eq(semesterModules.moduleId, moduleId),
			columns: { id: true },
		});

		if (semModules.length === 0) return null;

		const semesterModuleIds = semModules.map((sm) => sm.id);

		const result = await db.query.studentModules.findFirst({
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

		if (!result) return null;

		const resultStdNo = result.studentSemester?.studentProgram?.stdNo;
		if (resultStdNo !== stdNo) {
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

		return {
			id: result.id,
			moduleId: result.semesterModule?.moduleId ?? moduleId,
			stdNo: result.studentSemester?.studentProgram?.stdNo ?? stdNo,
			grade: result.grade,
			weightedTotal: parseFloat(result.marks) || 0,
			createdAt: result.createdAt,
			updatedAt: result.createdAt,
		};
	}

	async findByModuleId(moduleId: number): Promise<ModuleGradeData[]> {
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
}

export const moduleGradesRepository = new ModuleGradeRepository();
