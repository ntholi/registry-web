import { and, eq, ilike, or, type SQL, sql } from 'drizzle-orm';
import {
	db,
	programs,
	schools,
	sponsoredStudents,
	sponsoredTerms,
	sponsors,
	structureSemesters,
	structures,
	studentPrograms,
	studentSemesters,
	students,
	terms,
} from '@/core/database';

export interface SponsoredStudentsReportFilter {
	termId: number;
	schoolId?: number;
	programId?: number;
	semesterNumber?: string;
	sponsorId?: number;
	searchQuery?: string;
}

export interface SponsoredStudentRow {
	stdNo: number;
	name: string;
	schoolCode: string;
	programName: string;
	semesterNumber: string;
	sponsorName: string;
	borrowerNo: string | null;
	bankName: string | null;
	accountNumber: string | null;
}

export interface SponsorSummary {
	sponsorName: string;
	sponsorCode: string;
	studentCount: number;
}

export interface SchoolSummary {
	schoolCode: string;
	schoolName: string;
	studentCount: number;
}

export interface ProgramSummary {
	programName: string;
	schoolCode: string;
	studentCount: number;
}

export interface SemesterSummary {
	semester: string;
	studentCount: number;
}

export interface SponsoredStudentsSummary {
	totalStudents: number;
	bySponsor: SponsorSummary[];
	bySchool: SchoolSummary[];
	byProgram: ProgramSummary[];
	bySemester: SemesterSummary[];
}

export class SponsoredStudentsReportRepository {
	private buildWhereConditions(filter: SponsoredStudentsReportFilter): SQL[] {
		const conditions: SQL[] = [eq(sponsoredTerms.termId, filter.termId)];

		if (filter.schoolId) {
			conditions.push(eq(schools.id, filter.schoolId));
		}

		if (filter.programId) {
			conditions.push(eq(programs.id, filter.programId));
		}

		if (filter.semesterNumber) {
			conditions.push(
				eq(structureSemesters.semesterNumber, filter.semesterNumber)
			);
		}

		if (filter.sponsorId) {
			conditions.push(eq(sponsors.id, filter.sponsorId));
		}

		if (filter.searchQuery) {
			conditions.push(
				or(
					ilike(students.name, `%${filter.searchQuery}%`),
					ilike(
						sql`CAST(${students.stdNo} AS TEXT)`,
						`%${filter.searchQuery}%`
					),
					ilike(sponsoredStudents.borrowerNo, `%${filter.searchQuery}%`)
				)!
			);
		}

		return conditions;
	}

	private createBaseQuery() {
		return db
			.select({
				stdNo: students.stdNo,
				name: students.name,
				schoolCode: schools.code,
				programName: programs.name,
				semesterNumber: structureSemesters.semesterNumber,
				sponsorName: sponsors.name,
				borrowerNo: sponsoredStudents.borrowerNo,
				bankName: sponsoredStudents.bankName,
				accountNumber: sponsoredStudents.accountNumber,
			})
			.from(sponsoredTerms)
			.innerJoin(terms, eq(sponsoredTerms.termId, terms.id))
			.innerJoin(
				sponsoredStudents,
				eq(sponsoredTerms.sponsoredStudentId, sponsoredStudents.id)
			)
			.innerJoin(sponsors, eq(sponsoredStudents.sponsorId, sponsors.id))
			.innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo))
			.innerJoin(studentSemesters, eq(studentSemesters.termCode, terms.code))
			.innerJoin(
				studentPrograms,
				and(
					eq(studentSemesters.studentProgramId, studentPrograms.id),
					eq(studentPrograms.stdNo, students.stdNo)
				)
			)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id));
	}

	async getSponsoredStudents(
		filter: SponsoredStudentsReportFilter,
		page: number = 1,
		pageSize: number = 20
	): Promise<{
		students: SponsoredStudentRow[];
		totalCount: number;
		currentPage: number;
		totalPages: number;
	}> {
		const conditions = this.buildWhereConditions(filter);
		const offset = (page - 1) * pageSize;

		const countResult = await db
			.select({ count: sql<number>`count(DISTINCT ${students.stdNo})` })
			.from(sponsoredTerms)
			.innerJoin(terms, eq(sponsoredTerms.termId, terms.id))
			.innerJoin(
				sponsoredStudents,
				eq(sponsoredTerms.sponsoredStudentId, sponsoredStudents.id)
			)
			.innerJoin(sponsors, eq(sponsoredStudents.sponsorId, sponsors.id))
			.innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo))
			.innerJoin(studentSemesters, eq(studentSemesters.termCode, terms.code))
			.innerJoin(
				studentPrograms,
				and(
					eq(studentSemesters.studentProgramId, studentPrograms.id),
					eq(studentPrograms.stdNo, students.stdNo)
				)
			)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...conditions));

		const totalCount = countResult[0]?.count ?? 0;
		const totalPages = Math.ceil(totalCount / pageSize);

		const studentsData = await this.createBaseQuery()
			.where(and(...conditions))
			.groupBy(
				students.stdNo,
				students.name,
				schools.code,
				programs.name,
				structureSemesters.semesterNumber,
				sponsors.name,
				sponsoredStudents.borrowerNo,
				sponsoredStudents.bankName,
				sponsoredStudents.accountNumber
			)
			.orderBy(students.name)
			.limit(pageSize)
			.offset(offset);

		return {
			students: studentsData,
			totalCount,
			currentPage: page,
			totalPages,
		};
	}

	async getAllSponsoredStudentsForExport(
		filter: SponsoredStudentsReportFilter
	): Promise<SponsoredStudentRow[]> {
		const conditions = this.buildWhereConditions(filter);

		const studentsData = await this.createBaseQuery()
			.where(and(...conditions))
			.groupBy(
				students.stdNo,
				students.name,
				schools.code,
				programs.name,
				structureSemesters.semesterNumber,
				sponsors.name,
				sponsoredStudents.borrowerNo,
				sponsoredStudents.bankName,
				sponsoredStudents.accountNumber
			)
			.orderBy(students.name);

		return studentsData;
	}

	async getSummary(
		filter: SponsoredStudentsReportFilter
	): Promise<SponsoredStudentsSummary> {
		const conditions = this.buildWhereConditions(filter);

		const totalResult = await db
			.select({
				total: sql<number>`count(DISTINCT ${students.stdNo})`,
			})
			.from(sponsoredTerms)
			.innerJoin(terms, eq(sponsoredTerms.termId, terms.id))
			.innerJoin(
				sponsoredStudents,
				eq(sponsoredTerms.sponsoredStudentId, sponsoredStudents.id)
			)
			.innerJoin(sponsors, eq(sponsoredStudents.sponsorId, sponsors.id))
			.innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo))
			.innerJoin(studentSemesters, eq(studentSemesters.termCode, terms.code))
			.innerJoin(
				studentPrograms,
				and(
					eq(studentSemesters.studentProgramId, studentPrograms.id),
					eq(studentPrograms.stdNo, students.stdNo)
				)
			)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...conditions));

		const totalStudents = totalResult[0]?.total ?? 0;

		const bySponsor = await db
			.select({
				sponsorName: sponsors.name,
				sponsorCode: sponsors.code,
				studentCount: sql<number>`count(DISTINCT ${students.stdNo})`,
			})
			.from(sponsoredTerms)
			.innerJoin(terms, eq(sponsoredTerms.termId, terms.id))
			.innerJoin(
				sponsoredStudents,
				eq(sponsoredTerms.sponsoredStudentId, sponsoredStudents.id)
			)
			.innerJoin(sponsors, eq(sponsoredStudents.sponsorId, sponsors.id))
			.innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo))
			.innerJoin(studentSemesters, eq(studentSemesters.termCode, terms.code))
			.innerJoin(
				studentPrograms,
				and(
					eq(studentSemesters.studentProgramId, studentPrograms.id),
					eq(studentPrograms.stdNo, students.stdNo)
				)
			)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...conditions))
			.groupBy(sponsors.name, sponsors.code)
			.orderBy(sql`count(DISTINCT ${students.stdNo}) DESC`);

		const bySchool = await db
			.select({
				schoolCode: schools.code,
				schoolName: schools.name,
				studentCount: sql<number>`count(DISTINCT ${students.stdNo})`,
			})
			.from(sponsoredTerms)
			.innerJoin(terms, eq(sponsoredTerms.termId, terms.id))
			.innerJoin(
				sponsoredStudents,
				eq(sponsoredTerms.sponsoredStudentId, sponsoredStudents.id)
			)
			.innerJoin(sponsors, eq(sponsoredStudents.sponsorId, sponsors.id))
			.innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo))
			.innerJoin(studentSemesters, eq(studentSemesters.termCode, terms.code))
			.innerJoin(
				studentPrograms,
				and(
					eq(studentSemesters.studentProgramId, studentPrograms.id),
					eq(studentPrograms.stdNo, students.stdNo)
				)
			)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...conditions))
			.groupBy(schools.code, schools.name)
			.orderBy(sql`count(DISTINCT ${students.stdNo}) DESC`);

		const byProgram = await db
			.select({
				programName: programs.name,
				schoolCode: schools.code,
				studentCount: sql<number>`count(DISTINCT ${students.stdNo})`,
			})
			.from(sponsoredTerms)
			.innerJoin(terms, eq(sponsoredTerms.termId, terms.id))
			.innerJoin(
				sponsoredStudents,
				eq(sponsoredTerms.sponsoredStudentId, sponsoredStudents.id)
			)
			.innerJoin(sponsors, eq(sponsoredStudents.sponsorId, sponsors.id))
			.innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo))
			.innerJoin(studentSemesters, eq(studentSemesters.termCode, terms.code))
			.innerJoin(
				studentPrograms,
				and(
					eq(studentSemesters.studentProgramId, studentPrograms.id),
					eq(studentPrograms.stdNo, students.stdNo)
				)
			)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...conditions))
			.groupBy(programs.name, schools.code)
			.orderBy(sql`count(DISTINCT ${students.stdNo}) DESC`);

		const bySemester = await db
			.select({
				semester: structureSemesters.semesterNumber,
				studentCount: sql<number>`count(DISTINCT ${students.stdNo})`,
			})
			.from(sponsoredTerms)
			.innerJoin(terms, eq(sponsoredTerms.termId, terms.id))
			.innerJoin(
				sponsoredStudents,
				eq(sponsoredTerms.sponsoredStudentId, sponsoredStudents.id)
			)
			.innerJoin(sponsors, eq(sponsoredStudents.sponsorId, sponsors.id))
			.innerJoin(students, eq(sponsoredStudents.stdNo, students.stdNo))
			.innerJoin(studentSemesters, eq(studentSemesters.termCode, terms.code))
			.innerJoin(
				studentPrograms,
				and(
					eq(studentSemesters.studentProgramId, studentPrograms.id),
					eq(studentPrograms.stdNo, students.stdNo)
				)
			)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(and(...conditions))
			.groupBy(structureSemesters.semesterNumber)
			.orderBy(structureSemesters.semesterNumber);

		return {
			totalStudents,
			bySponsor,
			bySchool,
			byProgram,
			bySemester,
		};
	}

	async getTermCode(termId: number): Promise<string> {
		const term = await db
			.select({ code: terms.code })
			.from(terms)
			.where(eq(terms.id, termId))
			.limit(1);

		return term[0]?.code ?? '';
	}
}

export const sponsoredStudentsReportRepository =
	new SponsoredStudentsReportRepository();
