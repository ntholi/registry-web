import type { Grade } from '@academic/_database';
import type { SemesterStatus } from '@registry/_database';
import {
	and,
	count,
	desc,
	eq,
	ilike,
	notInArray,
	or,
	type SQL,
} from 'drizzle-orm';
import {
	db,
	modules,
	programs,
	schools,
	semesterModules,
	structureSemesters,
	structures,
	studentModules,
	studentPrograms,
	studentSemesters,
	students,
} from '@/core/database';
import { INACTIVE_SEMESTER_STATUSES } from '@/shared/lib/utils/utils';

export interface GradeFinderFilters {
	grade: Grade;
	schoolId?: number;
	programId?: number;
	semesterNumber?: string;
	termCode?: string;
	moduleId?: number;
	search?: string;
}

export interface GradeFinderResult {
	stdNo: number;
	studentName: string;
	moduleCode: string;
	moduleName: string;
	grade: Grade;
	marks: string;
	credits: number;
	termCode: string;
	semesterNumber: string;
	programCode: string;
	programName: string;
	schoolCode: string;
	schoolName: string;
}

const PAGE_SIZE = 50;

export async function findStudentsByGrade(
	filters: GradeFinderFilters,
	page = 1
): Promise<{ items: GradeFinderResult[]; total: number; pages: number }> {
	const conditions: SQL[] = [
		eq(studentModules.grade, filters.grade),
		notInArray(
			studentSemesters.status,
			INACTIVE_SEMESTER_STATUSES as SemesterStatus[]
		),
		notInArray(studentModules.status, ['Delete', 'Drop']),
	];

	if (filters.schoolId) {
		conditions.push(eq(schools.id, filters.schoolId));
	}

	if (filters.programId) {
		conditions.push(eq(programs.id, filters.programId));
	}

	if (filters.semesterNumber) {
		conditions.push(
			eq(structureSemesters.semesterNumber, filters.semesterNumber)
		);
	}

	if (filters.termCode) {
		conditions.push(eq(studentSemesters.termCode, filters.termCode));
	}

	if (filters.moduleId) {
		conditions.push(eq(modules.id, filters.moduleId));
	}

	if (filters.search) {
		const searchPattern = `%${filters.search}%`;
		conditions.push(
			or(
				ilike(students.name, searchPattern),
				ilike(modules.code, searchPattern),
				ilike(modules.name, searchPattern)
			)!
		);
	}

	const baseQuery = db
		.select({
			stdNo: students.stdNo,
			studentName: students.name,
			moduleCode: modules.code,
			moduleName: modules.name,
			grade: studentModules.grade,
			marks: studentModules.marks,
			credits: studentModules.credits,
			termCode: studentSemesters.termCode,
			semesterNumber: structureSemesters.semesterNumber,
			programCode: programs.code,
			programName: programs.name,
			schoolCode: schools.code,
			schoolName: schools.name,
		})
		.from(studentModules)
		.innerJoin(
			studentSemesters,
			eq(studentModules.studentSemesterId, studentSemesters.id)
		)
		.innerJoin(
			studentPrograms,
			eq(studentSemesters.studentProgramId, studentPrograms.id)
		)
		.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
		.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
		.innerJoin(programs, eq(structures.programId, programs.id))
		.innerJoin(schools, eq(programs.schoolId, schools.id))
		.innerJoin(
			structureSemesters,
			eq(studentSemesters.structureSemesterId, structureSemesters.id)
		)
		.innerJoin(
			semesterModules,
			eq(studentModules.semesterModuleId, semesterModules.id)
		)
		.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
		.where(and(...conditions));

	const [countResult, items] = await Promise.all([
		db
			.select({ count: count() })
			.from(studentModules)
			.innerJoin(
				studentSemesters,
				eq(studentModules.studentSemesterId, studentSemesters.id)
			)
			.innerJoin(
				studentPrograms,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(
				semesterModules,
				eq(studentModules.semesterModuleId, semesterModules.id)
			)
			.innerJoin(modules, eq(semesterModules.moduleId, modules.id))
			.where(and(...conditions)),
		baseQuery
			.orderBy(desc(studentSemesters.termCode), students.name)
			.limit(PAGE_SIZE)
			.offset((page - 1) * PAGE_SIZE),
	]);

	const total = countResult[0]?.count ?? 0;

	return {
		items,
		total,
		pages: Math.ceil(total / PAGE_SIZE),
	};
}

export interface ModuleOption {
	id: number;
	code: string;
	name: string;
}

export async function searchModulesForFilter(
	search: string
): Promise<ModuleOption[]> {
	if (!search || search.length < 2) return [];

	const searchPattern = `%${search}%`;

	return db
		.selectDistinct({
			id: modules.id,
			code: modules.code,
			name: modules.name,
		})
		.from(modules)
		.where(
			or(ilike(modules.code, searchPattern), ilike(modules.name, searchPattern))
		)
		.orderBy(modules.code)
		.limit(20);
}
