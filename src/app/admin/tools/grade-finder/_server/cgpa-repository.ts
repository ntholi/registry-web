import type { SemesterStatus } from '@registry/_database';
import { and, eq, ilike, inArray, notInArray, or, type SQL } from 'drizzle-orm';
import {
	db,
	programs,
	schools,
	structureSemesters,
	structures,
	studentModules,
	studentPrograms,
	studentSemesters,
	students,
} from '@/core/database';
import { getAcademicRemarks } from '@/shared/lib/utils/grades';
import type { Program } from '@/shared/lib/utils/grades/type';
import { INACTIVE_SEMESTER_STATUSES } from '@/shared/lib/utils/utils';

export interface CGPAFinderFilters {
	minCGPA: number;
	maxCGPA: number;
	schoolIds?: number[];
	programId?: number;
	termCode?: string;
	search?: string;
}

export interface CGPAFinderResult {
	stdNo: number;
	studentName: string;
	programCode: string;
	programName: string;
	schoolCode: string;
	schoolName: string;
	gpa: number;
	cgpa: number;
	creditsAttempted: number;
	creditsCompleted: number;
	semesterCount: number;
	latestTermCode: string;
}

const PAGE_SIZE = 50;

export async function findStudentsByCGPA(
	filters: CGPAFinderFilters,
	page = 1
): Promise<{ items: CGPAFinderResult[]; total: number; pages: number }> {
	const conditions: SQL[] = [
		inArray(studentPrograms.status, ['Active', 'Completed']),
	];

	if (filters.schoolIds && filters.schoolIds.length > 0) {
		conditions.push(inArray(schools.id, filters.schoolIds));
	}

	if (filters.programId) {
		conditions.push(eq(programs.id, filters.programId));
	}

	if (filters.search) {
		const searchPattern = `%${filters.search}%`;
		conditions.push(
			or(
				ilike(students.name, searchPattern),
				ilike(programs.code, searchPattern),
				ilike(programs.name, searchPattern)
			)!
		);
	}

	const studentsData = await db
		.selectDistinct({
			stdNo: students.stdNo,
			studentName: students.name,
			programCode: programs.code,
			programName: programs.name,
			schoolCode: schools.code,
			schoolName: schools.name,
			studentProgramId: studentPrograms.id,
			structureId: studentPrograms.structureId,
			programStatus: studentPrograms.status,
			intakeDate: studentPrograms.intakeDate,
			graduationDate: studentPrograms.graduationDate,
		})
		.from(students)
		.innerJoin(studentPrograms, eq(studentPrograms.stdNo, students.stdNo))
		.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
		.innerJoin(programs, eq(structures.programId, programs.id))
		.innerJoin(schools, eq(programs.schoolId, schools.id))
		.where(and(...conditions))
		.orderBy(students.name)
		.limit(PAGE_SIZE * 5);

	const studentProgramIds = studentsData.map((s) => s.studentProgramId);
	if (studentProgramIds.length === 0) {
		return { items: [], total: 0, pages: 0 };
	}

	const semestersData = await db
		.select({
			studentProgramId: studentSemesters.studentProgramId,
			semesterId: studentSemesters.id,
			termCode: studentSemesters.termCode,
			status: studentSemesters.status,
			semesterNumber: structureSemesters.semesterNumber,
		})
		.from(studentSemesters)
		.innerJoin(
			structureSemesters,
			eq(studentSemesters.structureSemesterId, structureSemesters.id)
		)
		.where(
			and(
				inArray(studentSemesters.studentProgramId, studentProgramIds),
				notInArray(
					studentSemesters.status,
					INACTIVE_SEMESTER_STATUSES as SemesterStatus[]
				)
			)
		);

	const semesterIds = semestersData.map((s) => s.semesterId);

	const modulesData =
		semesterIds.length > 0
			? await db.query.studentModules.findMany({
					where: and(
						inArray(studentModules.studentSemesterId, semesterIds),
						notInArray(studentModules.status, ['Delete', 'Drop'])
					),
					with: {
						semesterModule: {
							columns: { type: true },
							with: {
								module: {
									columns: { id: true, code: true, name: true },
								},
							},
						},
					},
				})
			: [];

	const semesterMap = new Map<
		number,
		{
			id: number;
			termCode: string;
			status: SemesterStatus;
			semesterNumber: string;
			modules: typeof modulesData;
		}
	>();

	for (const sem of semestersData) {
		semesterMap.set(sem.semesterId, {
			id: sem.semesterId,
			termCode: sem.termCode,
			status: sem.status as SemesterStatus,
			semesterNumber: sem.semesterNumber,
			modules: [],
		});
	}

	for (const mod of modulesData) {
		const sem = semesterMap.get(mod.studentSemesterId);
		if (sem) {
			sem.modules.push(mod);
		}
	}

	const programSemestersMap = new Map<
		number,
		Array<{
			id: number;
			termCode: string;
			status: SemesterStatus;
			semesterNumber: string;
			modules: typeof modulesData;
		}>
	>();

	for (const sem of semestersData) {
		const existing = programSemestersMap.get(sem.studentProgramId) || [];
		const semWithModules = semesterMap.get(sem.semesterId);
		if (semWithModules) {
			existing.push(semWithModules);
		}
		programSemestersMap.set(sem.studentProgramId, existing);
	}

	const results: CGPAFinderResult[] = [];

	for (const student of studentsData) {
		const semesters = programSemestersMap.get(student.studentProgramId) || [];
		if (semesters.length === 0) continue;

		const programData: Program = {
			id: student.studentProgramId,
			status: student.programStatus,
			structureId: student.structureId,
			intakeDate: student.intakeDate,
			graduationDate: student.graduationDate,
			semesters: semesters.map((sem) => ({
				id: sem.id,
				status: sem.status,
				termCode: sem.termCode,
				structureSemester: { semesterNumber: sem.semesterNumber },
				studentModules: sem.modules.map((m) => ({
					id: m.id,
					semesterModuleId: m.semesterModuleId,
					grade: m.grade,
					marks: m.marks,
					status: m.status,
					credits: m.credits,
					semesterModule: {
						type: m.semesterModule?.type || 'Core',
						module: m.semesterModule?.module || null,
					},
				})),
			})),
			structure: {
				id: student.structureId,
				code: '',
				desc: null,
				programId: 0,
				createdAt: null,
				program: {
					id: 0,
					name: student.programName,
					code: student.programCode,
					school: { id: 0, name: student.schoolName },
				},
			},
		};

		const remarks = getAcademicRemarks([programData]);

		if (remarks.status === 'No Marks') continue;

		const { cgpa, gpa, creditsAttempted, creditsCompleted } =
			remarks.latestPoints;

		if (cgpa >= filters.minCGPA && cgpa <= filters.maxCGPA) {
			if (
				filters.termCode &&
				!semesters.some((s) => s.termCode === filters.termCode)
			) {
				continue;
			}

			const latestSemester = semesters.reduce((latest, sem) =>
				sem.termCode > (latest?.termCode || '') ? sem : latest
			);

			results.push({
				stdNo: student.stdNo,
				studentName: student.studentName,
				programCode: student.programCode,
				programName: student.programName,
				schoolCode: student.schoolCode,
				schoolName: student.schoolName,
				gpa,
				cgpa,
				creditsAttempted,
				creditsCompleted,
				semesterCount: semesters.length,
				latestTermCode: latestSemester?.termCode || '',
			});
		}
	}

	results.sort((a, b) => b.cgpa - a.cgpa);

	const total = results.length;
	const startIndex = (page - 1) * PAGE_SIZE;
	const paginatedItems = results.slice(startIndex, startIndex + PAGE_SIZE);

	return {
		items: paginatedItems,
		total,
		pages: Math.ceil(total / PAGE_SIZE),
	};
}

const EXPORT_LIMIT = 10000;

export async function exportStudentsByCGPA(
	filters: CGPAFinderFilters
): Promise<CGPAFinderResult[]> {
	const conditions: SQL[] = [
		inArray(studentPrograms.status, ['Active', 'Completed']),
	];

	if (filters.schoolIds && filters.schoolIds.length > 0) {
		conditions.push(inArray(schools.id, filters.schoolIds));
	}

	if (filters.programId) {
		conditions.push(eq(programs.id, filters.programId));
	}

	if (filters.search) {
		const searchPattern = `%${filters.search}%`;
		conditions.push(
			or(
				ilike(students.name, searchPattern),
				ilike(programs.code, searchPattern),
				ilike(programs.name, searchPattern)
			)!
		);
	}

	const studentsData = await db
		.selectDistinct({
			stdNo: students.stdNo,
			studentName: students.name,
			programCode: programs.code,
			programName: programs.name,
			schoolCode: schools.code,
			schoolName: schools.name,
			studentProgramId: studentPrograms.id,
			structureId: studentPrograms.structureId,
			programStatus: studentPrograms.status,
			intakeDate: studentPrograms.intakeDate,
			graduationDate: studentPrograms.graduationDate,
		})
		.from(students)
		.innerJoin(studentPrograms, eq(studentPrograms.stdNo, students.stdNo))
		.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
		.innerJoin(programs, eq(structures.programId, programs.id))
		.innerJoin(schools, eq(programs.schoolId, schools.id))
		.where(and(...conditions))
		.orderBy(students.name)
		.limit(EXPORT_LIMIT);

	const studentProgramIds = studentsData.map((s) => s.studentProgramId);
	if (studentProgramIds.length === 0) {
		return [];
	}

	const semestersData = await db
		.select({
			studentProgramId: studentSemesters.studentProgramId,
			semesterId: studentSemesters.id,
			termCode: studentSemesters.termCode,
			status: studentSemesters.status,
			semesterNumber: structureSemesters.semesterNumber,
		})
		.from(studentSemesters)
		.innerJoin(
			structureSemesters,
			eq(studentSemesters.structureSemesterId, structureSemesters.id)
		)
		.where(
			and(
				inArray(studentSemesters.studentProgramId, studentProgramIds),
				notInArray(
					studentSemesters.status,
					INACTIVE_SEMESTER_STATUSES as SemesterStatus[]
				)
			)
		);

	const semesterIds = semestersData.map((s) => s.semesterId);

	const modulesData =
		semesterIds.length > 0
			? await db.query.studentModules.findMany({
					where: and(
						inArray(studentModules.studentSemesterId, semesterIds),
						notInArray(studentModules.status, ['Delete', 'Drop'])
					),
					with: {
						semesterModule: {
							columns: { type: true },
							with: {
								module: {
									columns: { id: true, code: true, name: true },
								},
							},
						},
					},
				})
			: [];

	const semesterMap = new Map<
		number,
		{
			id: number;
			termCode: string;
			status: SemesterStatus;
			semesterNumber: string;
			modules: typeof modulesData;
		}
	>();

	for (const sem of semestersData) {
		semesterMap.set(sem.semesterId, {
			id: sem.semesterId,
			termCode: sem.termCode,
			status: sem.status as SemesterStatus,
			semesterNumber: sem.semesterNumber,
			modules: [],
		});
	}

	for (const mod of modulesData) {
		const sem = semesterMap.get(mod.studentSemesterId);
		if (sem) {
			sem.modules.push(mod);
		}
	}

	const programSemestersMap = new Map<
		number,
		Array<{
			id: number;
			termCode: string;
			status: SemesterStatus;
			semesterNumber: string;
			modules: typeof modulesData;
		}>
	>();

	for (const sem of semestersData) {
		const existing = programSemestersMap.get(sem.studentProgramId) || [];
		const semWithModules = semesterMap.get(sem.semesterId);
		if (semWithModules) {
			existing.push(semWithModules);
		}
		programSemestersMap.set(sem.studentProgramId, existing);
	}

	const results: CGPAFinderResult[] = [];

	for (const student of studentsData) {
		const semesters = programSemestersMap.get(student.studentProgramId) || [];
		if (semesters.length === 0) continue;

		const programData: Program = {
			id: student.studentProgramId,
			status: student.programStatus,
			structureId: student.structureId,
			intakeDate: student.intakeDate,
			graduationDate: student.graduationDate,
			semesters: semesters.map((sem) => ({
				id: sem.id,
				status: sem.status,
				termCode: sem.termCode,
				structureSemester: { semesterNumber: sem.semesterNumber },
				studentModules: sem.modules.map((m) => ({
					id: m.id,
					semesterModuleId: m.semesterModuleId,
					grade: m.grade,
					marks: m.marks,
					status: m.status,
					credits: m.credits,
					semesterModule: {
						type: m.semesterModule?.type || 'Core',
						module: m.semesterModule?.module || null,
					},
				})),
			})),
			structure: {
				id: student.structureId,
				code: '',
				desc: null,
				programId: 0,
				createdAt: null,
				program: {
					id: 0,
					name: student.programName,
					code: student.programCode,
					school: { id: 0, name: student.schoolName },
				},
			},
		};

		const remarks = getAcademicRemarks([programData]);

		if (remarks.status === 'No Marks') continue;

		const { cgpa, gpa, creditsAttempted, creditsCompleted } =
			remarks.latestPoints;

		if (cgpa >= filters.minCGPA && cgpa <= filters.maxCGPA) {
			if (
				filters.termCode &&
				!semesters.some((s) => s.termCode === filters.termCode)
			) {
				continue;
			}

			const latestSemester = semesters.reduce((latest, sem) =>
				sem.termCode > (latest?.termCode || '') ? sem : latest
			);

			results.push({
				stdNo: student.stdNo,
				studentName: student.studentName,
				programCode: student.programCode,
				programName: student.programName,
				schoolCode: student.schoolCode,
				schoolName: student.schoolName,
				gpa,
				cgpa,
				creditsAttempted,
				creditsCompleted,
				semesterCount: semesters.length,
				latestTermCode: latestSemester?.termCode || '',
			});
		}
	}

	results.sort((a, b) => b.cgpa - a.cgpa);

	return results;
}
