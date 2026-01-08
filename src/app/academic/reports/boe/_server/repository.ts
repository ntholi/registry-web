import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import {
	db,
	programs,
	schools,
	structureSemesters,
	structures,
	studentPrograms,
	studentSemesters,
	students,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';
import {
	compareSemesters,
	formatSemester,
	INACTIVE_SEMESTER_STATUSES,
} from '@/shared/lib/utils/utils';

export interface BoeFilter {
	termId: number;
	schoolIds: number[];
	programId?: number;
	semesterNumber?: string;
}

export interface StudentModuleReport {
	studentId: number;
	studentName: string;
	moduleCode: string;
	moduleName: string;
	credits: number;
	marks: string;
	grade: string;
}

export interface StudentSemesterReport {
	studentId: number;
	studentName: string;
	studentModules: StudentModuleReport[];
	modulesCount: number;
	creditsAttempted: number;
	creditsEarned: number;
	totalPoints: number;
	gpa: string;
	cgpa: string;
	facultyRemark?: string;
}

export interface ProgramSemesterReport {
	programId: number;
	programCode: string;
	programName: string;
	semesterNumber: string;
	students: StudentSemesterReport[];
}

export interface BoeSummaryProgram {
	programId: number;
	programCode: string;
	programName: string;
	semesters: Record<string, number>;
	totalStudents: number;
}

export interface BoeSummarySchool {
	schoolId: number;
	schoolName: string;
	schoolCode: string;
	programs: BoeSummaryProgram[];
	totalStudents: number;
}

export interface BoeStatsClassRow {
	className: string;
	semesterNumber: string;
	passed: number;
	failed: number;
	droppedOut: number;
	withdrawn: number;
	deferred: number;
	totalActive: number;
	totalStudents: number;
}

export interface BoeStatsProgramRow {
	programId: number;
	programCode: string;
	programName: string;
	passed: number;
	failed: number;
	droppedOut: number;
	withdrawn: number;
	deferred: number;
	totalActive: number;
	totalStudents: number;
	classes: BoeStatsClassRow[];
}

export interface BoeStatsSchool {
	schoolId: number;
	schoolName: string;
	schoolCode: string;
	programs: BoeStatsProgramRow[];
	totals: {
		passed: number;
		failed: number;
		droppedOut: number;
		withdrawn: number;
		deferred: number;
		totalActive: number;
		totalStudents: number;
	};
}

export default class BoeReportRepository extends BaseRepository<
	typeof students,
	'stdNo'
> {
	constructor() {
		super(students, students.stdNo);
	}

	async findSemesters(filter: BoeFilter) {
		const { termId, schoolIds, programId, semesterNumber } = filter;

		const term = await db.query.terms.findFirst({
			where: (t) => eq(t.id, termId),
		});
		if (!term) throw new Error('Term not found');

		const conditions = [inArray(programs.schoolId, schoolIds)];
		if (programId) {
			conditions.push(eq(programs.id, programId));
		}

		const facultyPrograms = await db.query.programs.findMany({
			where: and(...conditions),
		});

		const programIds = facultyPrograms.map((program) => program.id);
		if (programIds.length === 0) return [];

		const structureRows = await db
			.select({ id: structures.id })
			.from(structures)
			.where(inArray(structures.programId, programIds));

		const structureIds = structureRows.map((row) => row.id);
		if (structureIds.length === 0) return [];

		const studentProgramRows = await db
			.select({ id: studentPrograms.id })
			.from(studentPrograms)
			.where(inArray(studentPrograms.structureId, structureIds));

		const studentProgramIds = studentProgramRows.map((row) => row.id);
		if (studentProgramIds.length === 0) return [];

		const semesterConditions = [
			eq(studentSemesters.termCode, term.code),
			inArray(studentSemesters.studentProgramId, studentProgramIds),
			notInArray(studentSemesters.status, INACTIVE_SEMESTER_STATUSES),
		];

		if (semesterNumber) {
			const structureSemesterIds = await db
				.select({ id: structureSemesters.id })
				.from(structureSemesters)
				.where(eq(structureSemesters.semesterNumber, semesterNumber))
				.then((rows) => rows.map((r) => r.id));

			if (structureSemesterIds.length > 0) {
				semesterConditions.push(
					inArray(studentSemesters.structureSemesterId, structureSemesterIds)
				);
			}
		}

		return await db.query.studentSemesters.findMany({
			where: and(...semesterConditions),
			with: {
				structureSemester: true,
				studentProgram: {
					with: {
						student: true,
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
				studentModules: {
					where: (modules) => notInArray(modules.status, ['Drop', 'Delete']),
					with: {
						semesterModule: {
							with: {
								module: true,
							},
						},
					},
				},
			},
		});
	}

	async getSummary(filter: BoeFilter): Promise<BoeSummarySchool[]> {
		const { termId, schoolIds, programId, semesterNumber } = filter;

		const term = await db.query.terms.findFirst({
			where: (t) => eq(t.id, termId),
		});
		if (!term) throw new Error('Term not found');

		const baseQuery = db
			.select({
				schoolId: schools.id,
				schoolName: schools.name,
				schoolCode: schools.code,
				programId: programs.id,
				programCode: programs.code,
				programName: programs.name,
				semesterNumber: structureSemesters.semesterNumber,
				studentCount: sql<number>`count(distinct ${studentSemesters.id})`.as(
					'student_count'
				),
			})
			.from(studentSemesters)
			.innerJoin(
				studentPrograms,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.where(
				and(
					eq(studentSemesters.termCode, term.code),
					notInArray(studentSemesters.status, INACTIVE_SEMESTER_STATUSES),
					inArray(schools.id, schoolIds),
					programId ? eq(programs.id, programId) : undefined,
					semesterNumber
						? eq(structureSemesters.semesterNumber, semesterNumber)
						: undefined
				)
			)
			.groupBy(
				schools.id,
				schools.name,
				schools.code,
				programs.id,
				programs.code,
				programs.name,
				structureSemesters.semesterNumber
			);

		const results = await baseQuery;

		const schoolMap = new Map<number, BoeSummarySchool>();

		for (const row of results) {
			if (!schoolMap.has(row.schoolId)) {
				schoolMap.set(row.schoolId, {
					schoolId: row.schoolId,
					schoolName: row.schoolName,
					schoolCode: row.schoolCode,
					programs: [],
					totalStudents: 0,
				});
			}

			const school = schoolMap.get(row.schoolId)!;
			let program = school.programs.find((p) => p.programId === row.programId);

			if (!program) {
				program = {
					programId: row.programId,
					programCode: row.programCode,
					programName: row.programName,
					semesters: {},
					totalStudents: 0,
				};
				school.programs.push(program);
			}

			const count = Number(row.studentCount);
			program.semesters[row.semesterNumber] = count;
			program.totalStudents += count;
			school.totalStudents += count;
		}

		return Array.from(schoolMap.values()).sort((a, b) =>
			a.schoolName.localeCompare(b.schoolName)
		);
	}

	async findHistory(studentNumbers: number[]) {
		if (studentNumbers.length === 0) {
			return [];
		}

		const allResults = [];
		const batchSize = 50;

		for (let i = 0; i < studentNumbers.length; i += batchSize) {
			const batch = studentNumbers.slice(i, i + batchSize);

			const batchResults = await db.query.studentSemesters.findMany({
				where: and(
					inArray(
						studentSemesters.studentProgramId,
						db
							.select({ id: studentPrograms.id })
							.from(studentPrograms)
							.where(
								and(
									inArray(studentPrograms.stdNo, batch),
									eq(studentPrograms.status, 'Active')
								)
							)
					),
					notInArray(studentSemesters.status, INACTIVE_SEMESTER_STATUSES)
				),
				with: {
					structureSemester: true,
					studentProgram: {
						with: {
							student: true,
							structure: {
								with: {
									program: true,
								},
							},
						},
					},
					studentModules: {
						where: (modules) => notInArray(modules.status, ['Drop', 'Delete']),
						with: {
							semesterModule: {
								with: {
									module: true,
								},
							},
						},
					},
				},
			});

			allResults.push(...batchResults);
		}

		return allResults.sort((a, b) => {
			if (a.termCode !== b.termCode) {
				return a.termCode.localeCompare(b.termCode);
			}
			return compareSemesters(
				a.structureSemester?.semesterNumber ?? '',
				b.structureSemester?.semesterNumber ?? ''
			);
		});
	}

	async getStatistics(filter: BoeFilter): Promise<BoeStatsSchool[]> {
		const { termId, schoolIds, programId, semesterNumber } = filter;

		const term = await db.query.terms.findFirst({
			where: (t) => eq(t.id, termId),
		});
		if (!term) throw new Error('Term not found');

		const conditions = [inArray(programs.schoolId, schoolIds)];
		if (programId) {
			conditions.push(eq(programs.id, programId));
		}

		const facultyPrograms = await db.query.programs.findMany({
			where: and(...conditions),
		});

		const programIds = facultyPrograms.map((program) => program.id);
		if (programIds.length === 0) return [];

		const structureRows = await db
			.select({ id: structures.id })
			.from(structures)
			.where(inArray(structures.programId, programIds));

		const structureIds = structureRows.map((row) => row.id);
		if (structureIds.length === 0) return [];

		const studentProgramRows = await db
			.select({ id: studentPrograms.id })
			.from(studentPrograms)
			.where(inArray(studentPrograms.structureId, structureIds));

		const studentProgramIds = studentProgramRows.map((row) => row.id);
		if (studentProgramIds.length === 0) return [];

		const semesterConditions = [
			eq(studentSemesters.termCode, term.code),
			inArray(studentSemesters.studentProgramId, studentProgramIds),
		];

		if (semesterNumber) {
			const structureSemesterIds = await db
				.select({ id: structureSemesters.id })
				.from(structureSemesters)
				.where(eq(structureSemesters.semesterNumber, semesterNumber))
				.then((rows) => rows.map((r) => r.id));

			if (structureSemesterIds.length > 0) {
				semesterConditions.push(
					inArray(studentSemesters.structureSemesterId, structureSemesterIds)
				);
			}
		}

		const semesters = await db.query.studentSemesters.findMany({
			where: and(...semesterConditions),
			with: {
				structureSemester: true,
				studentProgram: {
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
				studentModules: {
					where: (modules) => notInArray(modules.status, ['Drop', 'Delete']),
					with: {
						semesterModule: {
							with: {
								module: true,
							},
						},
					},
				},
			},
		});

		const schoolMap = new Map<number, BoeStatsSchool>();

		for (const semester of semesters) {
			const school = semester.studentProgram.structure.program.school;
			const program = semester.studentProgram.structure.program;

			if (!schoolMap.has(school.id)) {
				schoolMap.set(school.id, {
					schoolId: school.id,
					schoolName: school.name,
					schoolCode: school.code,
					programs: [],
					totals: {
						passed: 0,
						failed: 0,
						droppedOut: 0,
						withdrawn: 0,
						deferred: 0,
						totalActive: 0,
						totalStudents: 0,
					},
				});
			}

			const schoolData = schoolMap.get(school.id)!;
			let programData = schoolData.programs.find(
				(p) => p.programId === program.id
			);

			if (!programData) {
				programData = {
					programId: program.id,
					programCode: program.code,
					programName: program.name,
					passed: 0,
					failed: 0,
					droppedOut: 0,
					withdrawn: 0,
					deferred: 0,
					totalActive: 0,
					totalStudents: 0,
					classes: [],
				};
				schoolData.programs.push(programData);
			}

			const semNum = semester.structureSemester?.semesterNumber ?? 'Unknown';
			const className = `${program.code}${formatSemester(semNum, 'mini')}`;

			let classData = programData.classes.find(
				(c) => c.className === className
			);
			if (!classData) {
				classData = {
					className,
					semesterNumber: semNum,
					passed: 0,
					failed: 0,
					droppedOut: 0,
					withdrawn: 0,
					deferred: 0,
					totalActive: 0,
					totalStudents: 0,
				};
				programData.classes.push(classData);
			}

			programData.totalStudents++;
			classData.totalStudents++;
			schoolData.totals.totalStudents++;

			const status = semester.status;

			if (status === 'DroppedOut') {
				programData.droppedOut++;
				classData.droppedOut++;
				schoolData.totals.droppedOut++;
			} else if (status === 'Withdrawn') {
				programData.withdrawn++;
				classData.withdrawn++;
				schoolData.totals.withdrawn++;
			} else if (status === 'Deferred') {
				programData.deferred++;
				classData.deferred++;
				schoolData.totals.deferred++;
			} else if (!INACTIVE_SEMESTER_STATUSES.includes(status)) {
				programData.totalActive++;
				classData.totalActive++;
				schoolData.totals.totalActive++;

				let totalPoints = 0;
				let totalCredits = 0;
				for (const mod of semester.studentModules) {
					const grade = mod.grade;
					const credits = Number(mod.credits) || 0;
					const gradePoint = this.getGradePoints(grade);
					totalPoints += gradePoint * credits;
					totalCredits += credits;
				}
				const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

				if (gpa >= 2) {
					programData.passed++;
					classData.passed++;
					schoolData.totals.passed++;
				} else {
					programData.failed++;
					classData.failed++;
					schoolData.totals.failed++;
				}
			}
		}

		for (const school of schoolMap.values()) {
			for (const program of school.programs) {
				program.classes.sort((a, b) =>
					compareSemesters(a.semesterNumber, b.semesterNumber)
				);
			}
		}

		return Array.from(schoolMap.values()).sort((a, b) =>
			a.schoolName.localeCompare(b.schoolName)
		);
	}

	private getGradePoints(grade: string): number {
		const gradeMap: Record<string, number> = {
			'A+': 4.0,
			A: 4.0,
			'A-': 3.7,
			'B+': 3.3,
			B: 3.0,
			'B-': 2.7,
			'C+': 2.3,
			C: 2.0,
			'C-': 1.7,
			'D+': 1.3,
			D: 1.0,
			'D-': 0.7,
			F: 0.0,
			FA: 0.0,
			I: 0.0,
			W: 0.0,
		};
		return gradeMap[grade?.toUpperCase()] ?? 0;
	}
}

export const boeReportRepository = new BoeReportRepository();
