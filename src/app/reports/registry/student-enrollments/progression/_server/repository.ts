import { and, eq, inArray, sql } from 'drizzle-orm';
import {
	db,
	programs,
	schools,
	structureSemesters,
	structures,
	studentPrograms,
	studentSemesters,
	students,
	terms,
} from '@/core/database';
import type { ProgressionReportFilter } from '../types';

interface ProgressionCohortRow {
	studentProgramId: number;
	stdNo: number;
	name: string;
	schoolCode: string;
	schoolName: string;
	programCode: string;
	programName: string;
	previousSemester: string;
	previousStatus: string;
	previousSemesterOrder: number;
	hasNextSemester: boolean;
	currentSemester: string | null;
	currentStatus: string | null;
	currentSemesterOrder: number | null;
}

export class ProgressionReportRepository {
	private semesterOrder(column: typeof structureSemesters.semesterNumber) {
		return sql<number>`
			CASE
				WHEN ${column} ~ '^[A-Z][0-9]+$'
					THEN ASCII(LEFT(${column}, 1)) * 1000 + CAST(SUBSTRING(${column} FROM 2) AS INTEGER)
				WHEN ${column} ~ '^[0-9]+$'
					THEN 1000000 + CAST(${column} AS INTEGER)
				ELSE 2000000
			END
		`;
	}

	private buildPreviousFilters(filter: ProgressionReportFilter | undefined) {
		const conditions: SQL[] = [];

		if (filter?.schoolIds && filter.schoolIds.length > 0) {
			conditions.push(inArray(schools.id, filter.schoolIds));
		}

		if (filter?.programId) {
			conditions.push(eq(programs.id, filter.programId));
		}

		return conditions;
	}

	async getTermsByIds(termIds: number[]) {
		return db
			.select({ id: terms.id, code: terms.code, name: terms.name })
			.from(terms)
			.where(inArray(terms.id, termIds));
	}

	async getProgressionCohort(
		previousTermCode: string,
		currentTermCode: string,
		filter?: ProgressionReportFilter
	): Promise<ProgressionCohortRow[]> {
		const semesterOrder = this.semesterOrder(structureSemesters.semesterNumber);

		const semesterSequence = db.$with('semester_sequence').as(
			db
				.select({
					structureSemesterId: structureSemesters.id,
					structureId: structureSemesters.structureId,
					semesterNumber: structureSemesters.semesterNumber,
					semesterOrder: semesterOrder.as('semester_order'),
					nextSemesterNumber: sql<string | null>`LEAD(${structureSemesters.semesterNumber}) OVER (
						PARTITION BY ${structureSemesters.structureId}
						ORDER BY ${semesterOrder}
					)`.as('next_semester_number'),
				})
				.from(structureSemesters)
		);

		const previousCohort = db.$with('previous_cohort').as(
			db
				.with(semesterSequence)
				.select({
					previousStudentProgramId: sql<number>`${studentPrograms.id}`.as(
						'previous_student_program_id'
					),
					stdNo: sql<number>`${students.stdNo}`.as('std_no'),
					name: sql<string>`${students.name}`.as('student_name'),
					schoolCode: sql<string>`${schools.code}`.as('school_code'),
					schoolName: sql<string>`${schools.name}`.as('school_name'),
					programCode: sql<string>`${programs.code}`.as('program_code'),
					programName: sql<string>`${programs.name}`.as('program_name'),
					previousSemester: sql<string>`${semesterSequence.semesterNumber}`.as(
						'previous_semester'
					),
					previousStatus: sql<string>`${studentSemesters.status}`.as(
						'previous_status'
					),
					previousSemesterOrder: sql<number>`${semesterSequence.semesterOrder}`.as(
						'previous_semester_order'
					),
					hasNextSemester:
						sql<boolean>`${semesterSequence.nextSemesterNumber} IS NOT NULL`.as(
							'has_next_semester'
						),
				})
				.from(studentSemesters)
				.innerJoin(
					studentPrograms,
					eq(studentPrograms.id, studentSemesters.studentProgramId)
				)
				.innerJoin(students, eq(students.stdNo, studentPrograms.stdNo))
				.innerJoin(structures, eq(structures.id, studentPrograms.structureId))
				.innerJoin(programs, eq(programs.id, structures.programId))
				.innerJoin(schools, eq(schools.id, programs.schoolId))
				.innerJoin(
					semesterSequence,
					eq(
						semesterSequence.structureSemesterId,
						studentSemesters.structureSemesterId
					)
				)
				.where(
					and(
						eq(studentSemesters.termCode, previousTermCode),
						inArray(studentPrograms.status, ['Active', 'Completed']),
						inArray(studentSemesters.status, [
							'Active',
							'Enrolled',
							'Exempted',
							'Outstanding',
							'Repeat',
							'DNR',
						]),
						...this.buildPreviousFilters(filter),
						filter?.semesterNumber
							? eq(semesterSequence.semesterNumber, filter.semesterNumber)
							: undefined
					)
				)
		);

		const currentCohort = db.$with('current_cohort').as(
			db
				.with(semesterSequence)
				.select({
					currentStudentProgramId: sql<number>`${studentSemesters.studentProgramId}`.as(
						'current_student_program_id'
					),
					currentSemester: sql<string>`${semesterSequence.semesterNumber}`.as(
						'current_semester'
					),
					currentStatus: sql<string>`${studentSemesters.status}`.as(
						'current_status'
					),
					currentSemesterOrder: sql<number>`${semesterSequence.semesterOrder}`.as(
						'current_semester_order'
					),
				})
				.from(studentSemesters)
				.innerJoin(
					semesterSequence,
					eq(
						semesterSequence.structureSemesterId,
						studentSemesters.structureSemesterId
					)
				)
				.where(eq(studentSemesters.termCode, currentTermCode))
		);

		return db
			.with(semesterSequence, previousCohort, currentCohort)
			.select({
				studentProgramId: previousCohort.previousStudentProgramId,
				stdNo: previousCohort.stdNo,
				name: previousCohort.name,
				schoolCode: previousCohort.schoolCode,
				schoolName: previousCohort.schoolName,
				programCode: previousCohort.programCode,
				programName: previousCohort.programName,
				previousSemester: previousCohort.previousSemester,
				previousStatus: previousCohort.previousStatus,
				previousSemesterOrder: previousCohort.previousSemesterOrder,
				hasNextSemester: previousCohort.hasNextSemester,
				currentSemester: currentCohort.currentSemester,
				currentStatus: currentCohort.currentStatus,
				currentSemesterOrder: currentCohort.currentSemesterOrder,
			})
			.from(previousCohort)
			.leftJoin(
				currentCohort,
				eq(
					currentCohort.currentStudentProgramId,
					previousCohort.previousStudentProgramId
				)
			)
			.orderBy(
				sql`${previousCohort.hasNextSemester} DESC`,
				sql`${previousCohort.previousSemesterOrder} DESC`,
				previousCohort.schoolCode,
				previousCohort.programCode,
				previousCohort.stdNo
			);
	}
}

export const progressionReportRepository = new ProgressionReportRepository();
	stdNo: number;
	name: string;
	schoolCode: string;
	schoolName: string;
	programCode: string;
	programName: string;
	previousSemester: string;
	previousStatus: string;
	previousSemesterOrder: number;
	hasNextSemester: boolean;
	currentSemester: string | null;
	currentStatus: string | null;
	currentSemesterOrder: number | null;
}

export class ProgressionReportRepository {
	private semesterOrder(column: typeof structureSemesters.semesterNumber) {
		return sql<number>`
			CASE
				WHEN ${column} ~ '^[A-Z][0-9]+$'
					THEN ASCII(LEFT(${column}, 1)) * 1000 + CAST(SUBSTRING(${column} FROM 2) AS INTEGER)
				WHEN ${column} ~ '^[0-9]+$'
					THEN 1000000 + CAST(${column} AS INTEGER)
				ELSE 2000000
			END
		`;
	}

	private buildPreviousFilters(filter: ProgressionReportFilter | undefined) {
		const conditions = [];

		if (filter?.schoolIds && filter.schoolIds.length > 0) {
					previousStudentProgramId: sql<number>`${studentPrograms.id}`.as(
						'previous_student_program_id'
					),
		if (filter?.programId) {
			conditions.push(eq(programs.id, filter.programId));
		}

		return conditions;
	}

	async getTermsByIds(termIds: number[]) 
		return db
			.select({ id: terms.id, code: terms.code, name: terms.name })
			.from(terms)
			.where(inArray(terms.id, termIds));

	async getProgressionCohort(
		previousTermCode: string,
		currentTermCode: string,
		filter?: ProgressionReportFilter
	): Promise<ProgressionCohortRow[]> {
		const semesterOrder = this.semesterOrder(structureSemesters.semesterNumber);

		const semesterSequence = db.$with('semester_sequence').as(
			db
				.select({
					structureSemesterId: structureSemesters.id,
					structureId: structureSemesters.structureId,
					semesterNumber: structureSemesters.semesterNumber,
					semesterOrder: semesterOrder.as('semester_order'),
					nextSemesterNumber: sql<
						string | null
					>`LEAD(${structureSemesters.semesterNumber}) OVER (
						PARTITION BY ${structureSemesters.structureId}
						ORDER BY ${semesterOrder}
					)`.as('next_semester_number'),
				})
				.from(structureSemesters)
		);

		const previousCohort = db.$with('previous_cohort').as(
			db
				.with(semesterSequence)
				.select({
					studentProgramId: sql<number>`${studentPrograms.id}`.as(
						'student_program_id'
					),
					stdNo: sql<number>`${students.stdNo}`.as('std_no'),
					name: sql<string>`${students.name}`.as('student_name'),
					schoolCode: sql<string>`${schools.code}`.as('school_code'),
					schoolName: sql<string>`${schools.name}`.as('school_name'),
					programCode: sql<string>`${programs.code}`.as('program_code'),
					programName: sql<string>`${programs.name}`.as('program_name'),
					previousSemester: sql<string>`${semesterSequence.semesterNumber}`.as(
						'previous_semester'
					),
					previousStatus: sql<string>`${studentSemesters.status}`.as(
						'previous_status'
					),
					previousSemesterOrder:
						sql<number>`${semesterSequence.semesterOrder}`.as(
							'previous_semester_order'
						),
					currentStudentProgramId:
						sql<number>`${studentSemesters.studentProgramId}`.as(
							'current_student_program_id'
						),
				})
				.from(studentSemesters)
				.innerJoin(
					studentPrograms,
					eq(studentPrograms.id, studentSemesters.studentProgramId)
				)
				.innerJoin(students, eq(students.stdNo, studentPrograms.stdNo))
				.innerJoin(structures, eq(structures.id, studentPrograms.structureId))
				.innerJoin(programs, eq(programs.id, structures.programId))
				.innerJoin(schools, eq(schools.id, programs.schoolId))
				.innerJoin(
					semesterSequence,
					eq(
						semesterSequence.structureSemesterId,
						studentSemesters.structureSemesterId
					)
				)
				.where(
					and(
						eq(studentSemesters.termCode, previousTermCode),
						inArray(studentPrograms.status, ['Active', 'Completed']),
						inArray(studentSemesters.status, [
							'Active',
							'Enrolled',
							'Exempted',
				studentProgramId: previousCohort.previousStudentProgramId,
							'Repeat',
							'DNR',
						]),
						...this.buildPreviousFilters(filter),
						filter?.semesterNumber
							? eq(semesterSequence.semesterNumber, filter.semesterNumber)
							: undefined
					)
				)
		);

		const currentCohort = db.$with('current_cohort').as(
			db
				.with(semesterSequence)
				.select({
					studentProgramId:
						sql<number>`${studentSemesters.studentProgramId}`.as(
				eq(
					currentCohort.currentStudentProgramId,
					previousCohort.previousStudentProgramId
				)
						),
					currentSemester: sql<string>`${semesterSequence.semesterNumber}`.as(
						'current_semester'
					),
					currentStatus: sql<string>`${studentSemesters.status}`.as(
						'current_status'
					),
					currentSemesterOrder:
						sql<number>`${semesterSequence.semesterOrder}`.as(
							'current_semester_order'
						),
				})
				.from(studentSemesters)
				.innerJoin(
					semesterSequence,
					eq(
						semesterSequence.structureSemesterId,
						studentSemesters.structureSemesterId
					)
				)
				.where(eq(studentSemesters.termCode, currentTermCode))
		);

		return db
			.with(semesterSequence, previousCohort, currentCohort)
			.select({
				studentProgramId: previousCohort.studentProgramId,
				stdNo: previousCohort.stdNo,
				name: previousCohort.name,
				schoolCode: previousCohort.schoolCode,
				schoolName: previousCohort.schoolName,
				programCode: previousCohort.programCode,
				programName: previousCohort.programName,
				previousSemester: previousCohort.previousSemester,
				previousStatus: previousCohort.previousStatus,
				previousSemesterOrder: previousCohort.previousSemesterOrder,
				hasNextSemester: previousCohort.hasNextSemester,
				currentSemester: currentCohort.currentSemester,
				currentStatus: currentCohort.currentStatus,
				currentSemesterOrder: currentCohort.currentSemesterOrder,
			})
			.from(previousCohort)
			.leftJoin(
				currentCohort,
				eq(currentCohort.studentProgramId, previousCohort.studentProgramId)
			)
			.orderBy(
				sql`${previousCohort.hasNextSemester} DESC`,
				sql`${previousCohort.previousSemesterOrder} DESC`,
				previousCohort.schoolCode,
				previousCohort.programCode,
				previousCohort.stdNo
			);
	}
}

export const progressionReportRepository = new ProgressionReportRepository();
