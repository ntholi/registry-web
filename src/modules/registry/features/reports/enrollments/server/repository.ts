import { and, desc, eq, inArray, like, or, type SQL, sql } from 'drizzle-orm';
import {
	db,
	programs,
	schools,
	sponsors,
	structureSemesters,
	structures,
	studentPrograms,
	studentSemesters,
	students,
	terms,
} from '@/core/database';

export interface RegistrationReportFilter {
	termIds?: number[];
	schoolId?: number;
	programId?: number;
	semesterNumber?: string;
	searchQuery?: string;
	gender?: string;
	sponsorId?: number;
	ageRangeMin?: number;
	ageRangeMax?: number;
	country?: string;
	studentStatus?: string;
	programStatus?: string;
	semesterStatus?: string;
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
	gender: string | null;
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
	termCode: string;
	totalStudents: number;
	students: FullRegistrationStudent[];
	generatedAt: Date;
}

export interface SummaryRegistrationReport {
	termCode: string;
	totalStudents: number;
	schools: SummarySchoolData[];
	generatedAt: Date;
}

interface ChartDataResult {
	studentsBySchool: Array<{ name: string; count: number; code: string }>;
	studentsByProgram: Array<{
		name: string;
		code: string;
		count: number;
		school: string;
	}>;
	studentsBySemester: Array<{ semester: string; count: number }>;
	studentsByGender: Array<{ gender: string; count: number }>;
	studentsBySponsor: Array<{ sponsor: string; count: number }>;
	programsBySchool: Array<{
		school: string;
		schoolCode: string;
		programCount: number;
	}>;
	studentsByAge: Array<{ age: number; count: number }>;
	studentsByCountry: Array<{ country: string; count: number }>;
	studentsBySemesterStatus: Array<{ status: string; count: number }>;
	studentsByProgramLevel: Array<{ level: string; count: number }>;
}

interface StudentQueryRow {
	stdNo: number;
	name: string;
	programName: string;
	semesterNumber: string | null;
	schoolName: string;
	schoolCode: string;
	phone: string | null;
	status: string;
	sponsorName: string | null;
	gender: string | null;
	dateOfBirth: Date | null;
	country: string | null;
}

interface ChartQueryRow {
	schoolName: string;
	schoolCode: string;
	programName: string;
	programCode: string;
	programLevel: string;
	semesterNumber: string | null;
	gender: string | null;
	sponsorName: string | null;
	studentId: number;
	dateOfBirth: Date | null;
	country: string | null;
	semesterStatus: string;
}

export class RegistrationReportRepository {
	private createBaseStudentQuery() {
		return db
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
				gender: students.gender,
				dateOfBirth: students.dateOfBirth,
				country: students.country,
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
	}

	private createCountQuery() {
		return db
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
	}

	private createChartQuery() {
		return db
			.select({
				schoolName: schools.name,
				schoolCode: schools.code,
				programName: programs.name,
				programCode: programs.code,
				programLevel: programs.level,
				semesterNumber: structureSemesters.semesterNumber,
				gender: students.gender,
				sponsorName: sponsors.name,
				studentId: students.stdNo,
				dateOfBirth: students.dateOfBirth,
				country: students.country,
				semesterStatus: studentSemesters.status,
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
	}

	private buildFilterConditions(
		filter: RegistrationReportFilter | undefined,
		options: { includeSearchQuery?: boolean } = {}
	): SQL[] {
		const conditions: SQL[] = [];

		if (filter?.studentStatus) {
			conditions.push(sql`${students.status} = ${filter.studentStatus}`);
		}

		if (filter?.programStatus) {
			conditions.push(sql`${studentPrograms.status} = ${filter.programStatus}`);
		} else {
			conditions.push(inArray(studentPrograms.status, ['Active', 'Completed']));
		}

		if (filter?.semesterStatus) {
			conditions.push(
				sql`${studentSemesters.status} = ${filter.semesterStatus}`
			);
		} else {
			conditions.push(
				inArray(studentSemesters.status, [
					'Active',
					'Enrolled',
					'Exempted',
					'Outstanding',
					'Repeat',
					'DNR',
				])
			);
		}

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

		if (filter?.gender) {
			conditions.push(
				sql`${students.gender} = ${filter.gender as 'Male' | 'Female' | 'Unknown'}`
			);
		}

		if (filter?.sponsorId) {
			conditions.push(eq(studentSemesters.sponsorId, filter.sponsorId));
		}

		if (filter?.country) {
			conditions.push(eq(students.country, filter.country));
		}

		if (filter?.ageRangeMin || filter?.ageRangeMax) {
			const currentDate = new Date();
			if (filter.ageRangeMin) {
				const maxBirthDate = new Date(
					currentDate.getFullYear() - filter.ageRangeMin,
					currentDate.getMonth(),
					currentDate.getDate()
				);
				conditions.push(sql`${students.dateOfBirth} <= ${maxBirthDate}`);
			}
			if (filter.ageRangeMax) {
				const minBirthDate = new Date(
					currentDate.getFullYear() - filter.ageRangeMax - 1,
					currentDate.getMonth(),
					currentDate.getDate()
				);
				conditions.push(sql`${students.dateOfBirth} >= ${minBirthDate}`);
			}
		}

		if (options.includeSearchQuery && filter?.searchQuery?.trim()) {
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

		return conditions;
	}

	private mapRowToStudent(row: StudentQueryRow): FullRegistrationStudent {
		return {
			stdNo: row.stdNo,
			name: row.name,
			programName: row.programName,
			semesterNumber: row.semesterNumber || '',
			schoolName: row.schoolName,
			schoolCode: row.schoolCode,
			phone: row.phone || '',
			status: row.status,
			sponsorName: row.sponsorName || null,
			gender: row.gender || null,
		};
	}

	private processSummaryData(fullData: FullRegistrationStudent[]): {
		schoolsMap: Map<string, SummarySchoolData>;
		programsMap: Map<string, SummaryProgramData>;
	} {
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

		return { schoolsMap, programsMap };
	}

	private buildSummaryReport(
		termCode: string,
		fullData: FullRegistrationStudent[],
		schoolsMap: Map<string, SummarySchoolData>,
		programsMap: Map<string, SummaryProgramData>
	): SummaryRegistrationReport {
		const schoolsList = Array.from(schoolsMap.values())
			.map((school) => ({
				...school,
				programs: Array.from(programsMap.values())
					.filter((program) => program.schoolName === school.schoolName)
					.sort((a, b) => a.programName.localeCompare(b.programName)),
			}))
			.sort((a, b) => a.schoolName.localeCompare(b.schoolName));

		return {
			termCode,
			totalStudents: fullData.length,
			schools: schoolsList,
			generatedAt: new Date(),
		};
	}

	private aggregateChartData(result: ChartQueryRow[]): ChartDataResult {
		const schoolMap = new Map<string, number>();
		const programMap = new Map<
			string,
			{ count: number; school: string; code: string; name: string }
		>();
		const semesterMap = new Map<string, number>();
		const genderMap = new Map<string, number>();
		const sponsorMap = new Map<string, number>();
		const schoolProgramsMap = new Map<
			string,
			{ programs: Set<string>; schoolCode: string }
		>();
		const ageMap = new Map<number, number>();
		const countryMap = new Map<string, number>();
		const semesterStatusMap = new Map<string, number>();
		const programLevelMap = new Map<string, number>();

		const currentDate = new Date();

		result.forEach((row) => {
			schoolMap.set(row.schoolName, (schoolMap.get(row.schoolName) || 0) + 1);

			const programKey = `${row.programName}|${row.schoolName}`;
			if (!programMap.has(programKey)) {
				programMap.set(programKey, {
					count: 0,
					school: row.schoolName,
					code: row.programCode,
					name: row.programName,
				});
			}
			programMap.get(programKey)!.count++;

			const semester = row.semesterNumber || 'Unknown';
			semesterMap.set(semester, (semesterMap.get(semester) || 0) + 1);

			const gender = row.gender || 'Unknown';
			genderMap.set(gender, (genderMap.get(gender) || 0) + 1);

			const sponsor = row.sponsorName || 'Unknown';
			sponsorMap.set(sponsor, (sponsorMap.get(sponsor) || 0) + 1);

			if (!schoolProgramsMap.has(row.schoolName)) {
				schoolProgramsMap.set(row.schoolName, {
					programs: new Set(),
					schoolCode: row.schoolCode,
				});
			}
			schoolProgramsMap.get(row.schoolName)!.programs.add(row.programName);

			if (row.dateOfBirth) {
				const birthDate = new Date(row.dateOfBirth);
				const age = Math.floor(
					(currentDate.getTime() - birthDate.getTime()) /
						(365.25 * 24 * 60 * 60 * 1000)
				);
				if (age >= 0 && age <= 100) {
					ageMap.set(age, (ageMap.get(age) || 0) + 1);
				}
			}

			const country = row.country || 'Unknown';
			countryMap.set(country, (countryMap.get(country) || 0) + 1);

			const semesterStatus = row.semesterStatus || 'Unknown';
			semesterStatusMap.set(
				semesterStatus,
				(semesterStatusMap.get(semesterStatus) || 0) + 1
			);

			const programLevel = row.programLevel || 'Unknown';
			programLevelMap.set(
				programLevel,
				(programLevelMap.get(programLevel) || 0) + 1
			);
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
				.map(([_key, data]) => ({
					name: data.name,
					code: data.code,
					count: data.count,
					school: data.school,
				}))
				.sort((a, b) => b.count - a.count),
			studentsBySemester: Array.from(semesterMap.entries())
				.map(([semester, count]) => ({ semester, count }))
				.sort((a, b) => a.semester.localeCompare(b.semester)),
			studentsByGender: Array.from(genderMap.entries())
				.map(([gender, count]) => ({ gender, count }))
				.sort((a, b) => b.count - a.count),
			studentsBySponsor: Array.from(sponsorMap.entries())
				.map(([sponsor, count]) => ({ sponsor, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 5),
			programsBySchool: Array.from(schoolProgramsMap.entries())
				.map(([school, data]) => ({
					school,
					schoolCode: data.schoolCode,
					programCount: data.programs.size,
				}))
				.sort((a, b) => b.programCount - a.programCount),
			studentsByAge: Array.from(ageMap.entries())
				.map(([age, count]) => ({ age, count }))
				.sort((a, b) => a.age - b.age),
			studentsByCountry: Array.from(countryMap.entries())
				.map(([country, count]) => ({ country, count }))
				.sort((a, b) => b.count - a.count),
			studentsBySemesterStatus: Array.from(semesterStatusMap.entries())
				.map(([status, count]) => ({ status, count }))
				.sort((a, b) => b.count - a.count),
			studentsByProgramLevel: Array.from(programLevelMap.entries())
				.map(([level, count]) => ({ level, count }))
				.sort((a, b) => b.count - a.count),
		};
	}

	async getFullRegistrationData(
		termCode: string,
		filter?: RegistrationReportFilter
	): Promise<FullRegistrationStudent[]> {
		const query = this.createBaseStudentQuery();
		const conditions = [
			eq(studentSemesters.term, termCode),
			...this.buildFilterConditions(filter),
		];

		const result = await query
			.where(and(...conditions))
			.orderBy(schools.name, programs.name, structureSemesters.semesterNumber);

		return result.map((row) => this.mapRowToStudent(row));
	}

	async getPaginatedRegistrationData(
		termCode: string,
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

		const studentsQuery = this.createBaseStudentQuery();
		const countQuery = this.createCountQuery();

		const conditions = [
			eq(studentSemesters.term, termCode),
			...this.buildFilterConditions(filter, { includeSearchQuery: true }),
		];

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
			students: studentsResult.map((row) => this.mapRowToStudent(row)),
			totalCount,
			totalPages,
			currentPage: page,
		};
	}

	async getSummaryRegistrationData(
		termCode: string,
		filter?: RegistrationReportFilter
	): Promise<SummaryRegistrationReport> {
		const fullData = await this.getFullRegistrationData(termCode, filter);
		const { schoolsMap, programsMap } = this.processSummaryData(fullData);
		return this.buildSummaryReport(termCode, fullData, schoolsMap, programsMap);
	}

	async getTermById(termId: number) {
		const [term] = await db
			.select()
			.from(terms)
			.where(eq(terms.id, termId))
			.limit(1);

		return term;
	}

	async getTermsByIds(termIds: number[]) {
		return await db
			.select()
			.from(terms)
			.where(inArray(terms.id, termIds))
			.orderBy(desc(terms.code));
	}

	async getAllActiveTerms() {
		return await db.select().from(terms).orderBy(desc(terms.code));
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
		termCode: string,
		filter?: RegistrationReportFilter
	): Promise<ChartDataResult> {
		const query = this.createChartQuery();
		const conditions = [
			eq(studentSemesters.term, termCode),
			...this.buildFilterConditions(filter),
		];

		const result = await query.where(and(...conditions));
		return this.aggregateChartData(result);
	}

	async getChartDataForMultipleTerms(
		termCodes: string[],
		filter?: RegistrationReportFilter
	): Promise<ChartDataResult> {
		const query = this.createChartQuery();
		const conditions = [
			inArray(studentSemesters.term, termCodes),
			...this.buildFilterConditions(filter),
		];

		const result = await query.where(and(...conditions));
		return this.aggregateChartData(result);
	}

	async getAvailableSponsors() {
		return await db
			.select({
				id: sponsors.id,
				name: sponsors.name,
			})
			.from(sponsors)
			.orderBy(sponsors.name);
	}

	async getAvailableCountries() {
		const result = await db
			.selectDistinct({ country: students.country })
			.from(students)
			.where(sql`${students.country} IS NOT NULL AND ${students.country} != ''`)
			.orderBy(students.country);

		return result.map((row) => row.country).filter((c): c is string => !!c);
	}

	async getFullRegistrationDataForMultipleTerms(
		termCodes: string[],
		filter?: RegistrationReportFilter
	): Promise<FullRegistrationStudent[]> {
		const query = this.createBaseStudentQuery();
		const conditions = [
			inArray(studentSemesters.term, termCodes),
			...this.buildFilterConditions(filter),
		];

		const result = await query
			.where(and(...conditions))
			.orderBy(schools.name, programs.name, structureSemesters.semesterNumber);

		return result.map((row) => this.mapRowToStudent(row));
	}

	async getPaginatedRegistrationDataForMultipleTerms(
		termCodes: string[],
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

		const studentsQuery = this.createBaseStudentQuery();
		const countQuery = this.createCountQuery();

		const conditions = [
			inArray(studentSemesters.term, termCodes),
			...this.buildFilterConditions(filter, { includeSearchQuery: true }),
		];

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
			students: studentsResult.map((row) => this.mapRowToStudent(row)),
			totalCount,
			totalPages,
			currentPage: page,
		};
	}

	async getSummaryRegistrationDataForMultipleTerms(
		termCodes: string[],
		filter?: RegistrationReportFilter
	): Promise<SummaryRegistrationReport> {
		const fullData = await this.getFullRegistrationDataForMultipleTerms(
			termCodes,
			filter
		);
		const { schoolsMap, programsMap } = this.processSummaryData(fullData);
		return this.buildSummaryReport(
			termCodes.join(', '),
			fullData,
			schoolsMap,
			programsMap
		);
	}
}
