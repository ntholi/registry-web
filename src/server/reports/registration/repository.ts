import { and, desc, eq, inArray, like, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
	programs,
	schools,
	sponsors,
	structureSemesters,
	structures,
	studentPrograms,
	studentSemesters,
	students,
	terms,
} from '@/db/schema';

export interface RegistrationReportFilter {
	termId?: number;
	schoolId?: number;
	programId?: number;
	semesterNumber?: string;
	searchQuery?: string;
}

export interface FullRegistrationStudent {
	stdNo: number;
	name: string;
	programName: string;
	semesterNumber: string;
	schoolName: string;
	schoolCode: string;
	phone: string;
	status: string;
	sponsorName: string | null;
}

export interface SummaryProgramData {
	programName: string;
	schoolName: string;
	schoolCode: string;
	schoolId: number;
	yearBreakdown: { [year: string]: number };
	totalStudents: number;
}

export interface SummarySchoolData {
	schoolName: string;
	schoolCode: string;
	totalStudents: number;
	programs: SummaryProgramData[];
}

export interface FullRegistrationReport {
	termName: string;
	totalStudents: number;
	students: FullRegistrationStudent[];
	generatedAt: Date;
}

export interface SummaryRegistrationReport {
	termName: string;
	totalStudents: number;
	schools: SummarySchoolData[];
	generatedAt: Date;
}

export class RegistrationReportRepository {
	async getFullRegistrationData(
		termName: string,
		filter?: RegistrationReportFilter
	): Promise<FullRegistrationStudent[]> {
		const query = db
			.select({
				stdNo: students.stdNo,
				name: students.name,
				programName: programs.name,
				semesterNumber: structureSemesters.semesterNumber,
				schoolName: schools.name,
				schoolCode: schools.code,
				phone: students.phone1,
				status: studentSemesters.status,
				sponsorName: sponsors.name,
			})
			.from(studentSemesters)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(
				studentPrograms,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.leftJoin(sponsors, eq(studentSemesters.sponsorId, sponsors.id));

		const conditions = [
			eq(studentSemesters.term, termName),
			inArray(studentSemesters.status, ['Active', 'Repeat']),
			eq(studentPrograms.status, 'Active'),
		];

		if (filter?.schoolId) {
			conditions.push(eq(schools.id, filter.schoolId));
		}

		if (filter?.programId) {
			conditions.push(eq(programs.id, filter.programId));
		}

		if (filter?.semesterNumber) {
			conditions.push(
				eq(structureSemesters.semesterNumber, filter.semesterNumber)
			);
		}

		const result = await query
			.where(and(...conditions))
			.orderBy(schools.name, programs.name, structureSemesters.semesterNumber);

		return result.map((row) => ({
			stdNo: row.stdNo,
			name: row.name,
			programName: row.programName,
			semesterNumber: row.semesterNumber || '',
			schoolName: row.schoolName,
			schoolCode: row.schoolCode,
			phone: row.phone || '',
			status: row.status,
			sponsorName: row.sponsorName || null,
		}));
	}

	async getPaginatedRegistrationData(
		termName: string,
		page: number = 1,
		pageSize: number = 20,
		filter?: RegistrationReportFilter
	): Promise<{
		students: FullRegistrationStudent[];
		totalCount: number;
		totalPages: number;
		currentPage: number;
	}> {
		const offset = (page - 1) * pageSize;

		const studentsQuery = db
			.select({
				stdNo: students.stdNo,
				name: students.name,
				programName: programs.name,
				semesterNumber: structureSemesters.semesterNumber,
				schoolName: schools.name,
				schoolCode: schools.code,
				phone: students.phone1,
				status: studentSemesters.status,
				sponsorName: sponsors.name,
			})
			.from(studentSemesters)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(
				studentPrograms,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.leftJoin(sponsors, eq(studentSemesters.sponsorId, sponsors.id));

		const countQuery = db
			.select({ count: students.stdNo })
			.from(studentSemesters)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(
				studentPrograms,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id));

		const conditions = [
			eq(studentSemesters.term, termName),
			inArray(studentSemesters.status, ['Active', 'Repeat']),
			eq(studentPrograms.status, 'Active'),
		];

		if (filter?.schoolId) {
			conditions.push(eq(schools.id, filter.schoolId));
		}

		if (filter?.programId) {
			conditions.push(eq(programs.id, filter.programId));
		}

		if (filter?.semesterNumber) {
			conditions.push(
				eq(structureSemesters.semesterNumber, filter.semesterNumber)
			);
		}

		if (filter?.searchQuery?.trim()) {
			const searchTerm = `%${filter.searchQuery.trim()}%`;
			conditions.push(
				or(
					like(sql`CAST(${students.stdNo} AS TEXT)`, searchTerm),
					like(students.name, searchTerm),
					like(programs.name, searchTerm),
					like(schools.name, searchTerm),
					like(schools.code, searchTerm),
					like(students.phone1, searchTerm)
				)!
			);
		}

		const whereClause = and(...conditions);

		const [studentsResult, totalResult] = await Promise.all([
			studentsQuery
				.where(whereClause)
				.orderBy(schools.name, programs.name, structureSemesters.semesterNumber)
				.limit(pageSize)
				.offset(offset),
			countQuery.where(whereClause),
		]);

		const totalCount = totalResult.length;
		const totalPages = Math.ceil(totalCount / pageSize);

		return {
			students: studentsResult.map((row) => ({
				stdNo: row.stdNo,
				name: row.name,
				programName: row.programName,
				semesterNumber: row.semesterNumber || '',
				schoolName: row.schoolName,
				schoolCode: row.schoolCode,
				phone: row.phone || '',
				status: row.status,
				sponsorName: row.sponsorName || null,
			})),
			totalCount,
			totalPages,
			currentPage: page,
		};
	}

	async getSummaryRegistrationData(
		termName: string,
		filter?: RegistrationReportFilter
	): Promise<SummaryRegistrationReport> {
		const fullData = await this.getFullRegistrationData(termName, filter);

		const schoolsMap = new Map<string, SummarySchoolData>();
		const programsMap = new Map<string, SummaryProgramData>();

		fullData.forEach((student) => {
			const schoolKey = student.schoolName;
			const programKey = `${student.programName}_${student.schoolName}`;

			if (!schoolsMap.has(schoolKey)) {
				schoolsMap.set(schoolKey, {
					schoolName: student.schoolName,
					schoolCode: student.schoolCode,
					totalStudents: 0,
					programs: [],
				});
			}

			if (!programsMap.has(programKey)) {
				programsMap.set(programKey, {
					programName: student.programName,
					schoolName: student.schoolName,
					schoolCode: student.schoolCode,
					schoolId: 0,
					yearBreakdown: {},
					totalStudents: 0,
				});
			}

			const program = programsMap.get(programKey)!;
			const year = student.semesterNumber;

			if (
				!program.yearBreakdown[
					year as unknown as keyof typeof program.yearBreakdown
				]
			) {
				program.yearBreakdown[
					year as unknown as keyof typeof program.yearBreakdown
				] = 0;
			}

			program.yearBreakdown[
				year as unknown as keyof typeof program.yearBreakdown
			]++;
			program.totalStudents++;

			const school = schoolsMap.get(schoolKey)!;
			school.totalStudents++;
		});

		const schools = Array.from(schoolsMap.values())
			.map((school) => ({
				...school,
				programs: Array.from(programsMap.values())
					.filter((program) => program.schoolName === school.schoolName)
					.sort((a, b) => a.programName.localeCompare(b.programName)),
			}))
			.sort((a, b) => a.schoolName.localeCompare(b.schoolName));

		return {
			termName,
			totalStudents: fullData.length,
			schools,
			generatedAt: new Date(),
		};
	}

	async getTermById(termId: number) {
		const [term] = await db
			.select()
			.from(terms)
			.where(eq(terms.id, termId))
			.limit(1);

		return term;
	}

	async getAllActiveTerms() {
		return await db.select().from(terms).orderBy(desc(terms.name));
	}

	async getAvailableSchools() {
		return await db
			.select({
				id: schools.id,
				code: schools.code,
				name: schools.name,
			})
			.from(schools)
			.where(eq(schools.isActive, true))
			.orderBy(schools.code);
	}

	async getAvailablePrograms(schoolId?: number) {
		const baseQuery = db
			.select({
				id: programs.id,
				code: programs.code,
				name: programs.name,
				schoolId: programs.schoolId,
			})
			.from(programs);

		if (schoolId) {
			return await baseQuery
				.where(eq(programs.schoolId, schoolId))
				.orderBy(desc(programs.id));
		}

		return await baseQuery.orderBy(desc(programs.id));
	}

	async getChartData(
		termName: string,
		filter?: RegistrationReportFilter
	): Promise<{
		studentsBySchool: Array<{ name: string; count: number; code: string }>;
		studentsByProgram: Array<{ name: string; count: number; school: string }>;
		studentsBySemester: Array<{ semester: string; count: number }>;
		studentsByGender: Array<{ gender: string; count: number }>;
		studentsBySponsor: Array<{ sponsor: string; count: number }>;
		programsBySchool: Array<{ school: string; programCount: number }>;
	}> {
		const query = db
			.select({
				schoolName: schools.name,
				schoolCode: schools.code,
				programName: programs.name,
				semesterNumber: structureSemesters.semesterNumber,
				gender: students.gender,
				sponsorName: sponsors.name,
				studentId: students.stdNo,
			})
			.from(studentSemesters)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(
				studentPrograms,
				eq(studentSemesters.studentProgramId, studentPrograms.id)
			)
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.leftJoin(sponsors, eq(studentSemesters.sponsorId, sponsors.id));

		const conditions = [
			eq(studentSemesters.term, termName),
			inArray(studentSemesters.status, ['Active', 'Repeat']),
			eq(studentPrograms.status, 'Active'),
		];

		if (filter?.schoolId) {
			conditions.push(eq(schools.id, filter.schoolId));
		}

		if (filter?.programId) {
			conditions.push(eq(programs.id, filter.programId));
		}

		if (filter?.semesterNumber) {
			conditions.push(
				eq(structureSemesters.semesterNumber, filter.semesterNumber)
			);
		}

		const result = await query.where(and(...conditions));

		const schoolMap = new Map<string, number>();
		const programMap = new Map<string, { count: number; school: string }>();
		const semesterMap = new Map<string, number>();
		const genderMap = new Map<string, number>();
		const sponsorMap = new Map<string, number>();
		const schoolProgramsMap = new Map<string, Set<string>>();

		result.forEach((row) => {
			schoolMap.set(row.schoolName, (schoolMap.get(row.schoolName) || 0) + 1);

			const programKey = `${row.programName}|${row.schoolName}`;
			if (!programMap.has(programKey)) {
				programMap.set(programKey, {
					count: 0,
					school: row.schoolName,
				});
			}
			programMap.get(programKey)!.count++;

			const semester = row.semesterNumber || 'Unknown';
			semesterMap.set(semester, (semesterMap.get(semester) || 0) + 1);

			const gender = row.gender || 'Unknown';
			genderMap.set(gender, (genderMap.get(gender) || 0) + 1);

			const sponsor = row.sponsorName || 'Self-Sponsored';
			sponsorMap.set(sponsor, (sponsorMap.get(sponsor) || 0) + 1);

			if (!schoolProgramsMap.has(row.schoolName)) {
				schoolProgramsMap.set(row.schoolName, new Set());
			}
			schoolProgramsMap.get(row.schoolName)!.add(row.programName);
		});

		return {
			studentsBySchool: Array.from(schoolMap.entries())
				.map(([name, count]) => ({
					name,
					count,
					code: result.find((r) => r.schoolName === name)?.schoolCode || name,
				}))
				.sort((a, b) => b.count - a.count),
			studentsByProgram: Array.from(programMap.entries())
				.map(([key, data]) => ({
					name: key.split('|')[0],
					count: data.count,
					school: data.school,
				}))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10),
			studentsBySemester: Array.from(semesterMap.entries())
				.map(([semester, count]) => ({ semester, count }))
				.sort((a, b) => a.semester.localeCompare(b.semester)),
			studentsByGender: Array.from(genderMap.entries())
				.map(([gender, count]) => ({ gender, count }))
				.sort((a, b) => b.count - a.count),
			studentsBySponsor: Array.from(sponsorMap.entries())
				.map(([sponsor, count]) => ({ sponsor, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10),
			programsBySchool: Array.from(schoolProgramsMap.entries())
				.map(([school, programs]) => ({
					school,
					programCount: programs.size,
				}))
				.sort((a, b) => b.programCount - a.programCount),
		};
	}
}
