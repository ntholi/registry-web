import { and, desc, eq, ilike, inArray, isNotNull, or, sql } from 'drizzle-orm';
import {
	db,
	graduationDates,
	programs,
	schools,
	sponsors,
	structures,
	studentPrograms,
	students,
	terms,
} from '@/core/database';
import type {
	GraduationChartData,
	GraduationProgramData,
	GraduationReportFilter,
	GraduationSchoolData,
	GraduationStudent,
	GraduationSummaryReport,
} from '../_lib/types';

interface StudentQueryRow {
	stdNo: number;
	name: string;
	programName: string;
	programCode: string;
	schoolName: string;
	schoolCode: string;
	graduationDate: string;
	gender: string | null;
	dateOfBirth: Date | null;
	sponsorName: string | null;
	programLevel: string | null;
	country: string | null;
	regDate: string | null;
	intakeDate: string | null;
}

interface ChartQueryRow {
	schoolName: string;
	schoolCode: string;
	programName: string;
	programCode: string;
	programLevel: string;
	gender: string | null;
	sponsorName: string | null;
	studentId: number;
	dateOfBirth: Date | null;
	country: string | null;
	graduationDate: string;
}

export class GraduationReportRepository {
	private createBaseStudentQuery() {
		return db
			.select({
				stdNo: students.stdNo,
				name: students.name,
				programName: programs.name,
				programCode: programs.code,
				schoolName: schools.name,
				schoolCode: schools.code,
				graduationDate: studentPrograms.graduationDate,
				gender: students.gender,
				dateOfBirth: students.dateOfBirth,
				sponsorName: sponsors.name,
				programLevel: programs.level,
				country: students.country,
				regDate: studentPrograms.regDate,
				intakeDate: studentPrograms.intakeDate,
			})
			.from(studentPrograms)
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.leftJoin(sponsors, eq(studentPrograms.assistProvider, sponsors.name));
	}

	private createCountQuery() {
		return db
			.select({ count: students.stdNo })
			.from(studentPrograms)
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
				gender: students.gender,
				sponsorName: sponsors.name,
				studentId: students.stdNo,
				dateOfBirth: students.dateOfBirth,
				country: students.country,
				graduationDate: studentPrograms.graduationDate,
			})
			.from(studentPrograms)
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.leftJoin(sponsors, eq(studentPrograms.assistProvider, sponsors.name));
	}

	private buildFilterConditions(
		filter: GraduationReportFilter | undefined,
		options: { includeSearchQuery?: boolean } = {}
	): ReturnType<typeof sql>[] {
		const conditions: ReturnType<typeof sql>[] = [];

		conditions.push(isNotNull(studentPrograms.graduationDate));
		conditions.push(sql`${studentPrograms.graduationDate} != ''`);

		if (filter?.graduationMonth) {
			conditions.push(
				sql`${studentPrograms.graduationDate} LIKE ${`${filter.graduationMonth}%`}`
			);
		}

		if (filter?.schoolIds && filter.schoolIds.length > 0) {
			conditions.push(inArray(schools.id, filter.schoolIds));
		}

		if (filter?.programLevels && filter.programLevels.length > 0) {
			conditions.push(inArray(programs.level, filter.programLevels));
		}

		if (filter?.programId) {
			conditions.push(eq(programs.id, filter.programId));
		}

		if (filter?.gender) {
			conditions.push(
				sql`${students.gender} = ${filter.gender as 'Male' | 'Female' | 'Unknown'}`
			);
		}

		if (filter?.sponsorId) {
			const sponsorQuery = db
				.select({ name: sponsors.name })
				.from(sponsors)
				.where(eq(sponsors.id, filter.sponsorId));
			conditions.push(
				sql`${studentPrograms.assistProvider} = (${sponsorQuery})`
			);
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
					ilike(sql`CAST(${students.stdNo} AS TEXT)`, searchTerm),
					ilike(students.name, searchTerm),
					ilike(programs.name, searchTerm),
					ilike(schools.name, searchTerm),
					ilike(schools.code, searchTerm)
				)!
			);
		}

		return conditions;
	}

	private calculateAge(dateOfBirth: Date | null): number | null {
		if (!dateOfBirth) return null;
		const birthDate = new Date(dateOfBirth);
		const today = new Date();
		return Math.floor(
			(today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
		);
	}

	private calculateTimeToGraduate(
		regDate: string | null,
		intakeDate: string | null,
		graduationDate: string
	): number | null {
		const startDate = regDate || intakeDate;
		if (!startDate) return null;

		const start = new Date(startDate);
		const end = new Date(graduationDate);

		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
			return null;

		const years =
			(end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
		return Math.round(years * 10) / 10;
	}

	private mapRowToStudent(row: StudentQueryRow): GraduationStudent {
		return {
			stdNo: row.stdNo,
			name: row.name,
			programName: row.programName,
			programCode: row.programCode,
			schoolName: row.schoolName,
			schoolCode: row.schoolCode,
			graduationDate: row.graduationDate || '',
			gender: row.gender || null,
			sponsorName: row.sponsorName || null,
			programLevel: row.programLevel || null,
			country: row.country || null,
			age: this.calculateAge(row.dateOfBirth),
			timeToGraduate: this.calculateTimeToGraduate(
				row.regDate,
				row.intakeDate,
				row.graduationDate || ''
			),
		};
	}

	private processSummaryData(fullData: GraduationStudent[]): {
		schoolsMap: Map<string, GraduationSchoolData>;
		programsMap: Map<string, GraduationProgramData>;
	} {
		const schoolsMap = new Map<string, GraduationSchoolData>();
		const programsMap = new Map<string, GraduationProgramData>();

		for (const student of fullData) {
			const schoolKey = student.schoolName;
			const programKey = `${student.programName}_${student.schoolName}`;

			if (!schoolsMap.has(schoolKey)) {
				schoolsMap.set(schoolKey, {
					schoolName: student.schoolName,
					schoolCode: student.schoolCode,
					totalGraduates: 0,
					maleCount: 0,
					femaleCount: 0,
					programs: [],
				});
			}

			if (!programsMap.has(programKey)) {
				programsMap.set(programKey, {
					programName: student.programName,
					programCode: student.programCode,
					schoolName: student.schoolName,
					schoolCode: student.schoolCode,
					schoolId: 0,
					totalGraduates: 0,
					maleCount: 0,
					femaleCount: 0,
				});
			}

			const program = programsMap.get(programKey)!;
			program.totalGraduates++;
			if (student.gender === 'Male') program.maleCount++;
			else if (student.gender === 'Female') program.femaleCount++;

			const school = schoolsMap.get(schoolKey)!;
			school.totalGraduates++;
			if (student.gender === 'Male') school.maleCount++;
			else if (student.gender === 'Female') school.femaleCount++;
		}

		return { schoolsMap, programsMap };
	}

	private buildSummaryReport(
		graduationDate: string,
		fullData: GraduationStudent[],
		schoolsMap: Map<string, GraduationSchoolData>,
		programsMap: Map<string, GraduationProgramData>
	): GraduationSummaryReport {
		const schoolsList = Array.from(schoolsMap.values())
			.map((school) => ({
				...school,
				programs: Array.from(programsMap.values())
					.filter((program) => program.schoolName === school.schoolName)
					.sort((a, b) => a.programName.localeCompare(b.programName)),
			}))
			.sort((a, b) => a.schoolName.localeCompare(b.schoolName));

		const maleCount = fullData.filter((s) => s.gender === 'Male').length;
		const femaleCount = fullData.filter((s) => s.gender === 'Female').length;

		const ages = fullData
			.map((s) => s.age)
			.filter((a): a is number => a !== null);
		const averageAge =
			ages.length > 0
				? Math.round((ages.reduce((sum, a) => sum + a, 0) / ages.length) * 10) /
					10
				: null;

		const times = fullData
			.map((s) => s.timeToGraduate)
			.filter((t): t is number => t !== null && t > 0);
		const averageTimeToGraduate =
			times.length > 0
				? Math.round(
						(times.reduce((sum, t) => sum + t, 0) / times.length) * 10
					) / 10
				: null;

		return {
			graduationDate,
			totalGraduates: fullData.length,
			maleCount,
			femaleCount,
			averageAge,
			averageTimeToGraduate,
			schools: schoolsList,
			generatedAt: new Date(),
		};
	}

	private aggregateChartData(result: ChartQueryRow[]): GraduationChartData {
		const schoolMap = new Map<string, number>();
		const programMap = new Map<
			string,
			{ count: number; school: string; code: string; name: string }
		>();
		const genderMap = new Map<string, number>();
		const programLevelMap = new Map<string, number>();
		const countryMap = new Map<string, number>();
		const ageMap = new Map<number, number>();
		const yearMap = new Map<string, number>();

		const currentDate = new Date();

		for (const row of result) {
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

			const gender = row.gender || 'Unknown';
			genderMap.set(gender, (genderMap.get(gender) || 0) + 1);

			const programLevel = row.programLevel || 'Unknown';
			programLevelMap.set(
				programLevel,
				(programLevelMap.get(programLevel) || 0) + 1
			);

			const country = row.country || 'Unknown';
			countryMap.set(country, (countryMap.get(country) || 0) + 1);

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

			if (row.graduationDate) {
				const year = row.graduationDate.substring(0, 4);
				yearMap.set(year, (yearMap.get(year) || 0) + 1);
			}
		}

		return {
			graduatesBySchool: Array.from(schoolMap.entries())
				.map(([name, count]) => ({
					name,
					count,
					code: result.find((r) => r.schoolName === name)?.schoolCode || name,
				}))
				.sort((a, b) => b.count - a.count),
			graduatesByProgram: Array.from(programMap.entries())
				.map(([_key, data]) => ({
					name: data.name,
					code: data.code,
					count: data.count,
					school: data.school,
				}))
				.sort((a, b) => b.count - a.count),
			graduatesByGender: Array.from(genderMap.entries())
				.map(([gender, count]) => ({ gender, count }))
				.sort((a, b) => b.count - a.count),
			graduatesByProgramLevel: Array.from(programLevelMap.entries())
				.map(([level, count]) => ({ level, count }))
				.sort((a, b) => b.count - a.count),
			graduatesByCountry: Array.from(countryMap.entries())
				.map(([country, count]) => ({ country, count }))
				.sort((a, b) => b.count - a.count),
			graduatesByAge: Array.from(ageMap.entries())
				.map(([age, count]) => ({ age, count }))
				.sort((a, b) => a.age - b.age),
			graduatesByYear: Array.from(yearMap.entries())
				.map(([year, count]) => ({ year, count }))
				.sort((a, b) => a.year.localeCompare(b.year)),
		};
	}

	async getGraduationDates() {
		return db
			.select({
				id: graduationDates.id,
				date: graduationDates.date,
				termCode: terms.code,
			})
			.from(graduationDates)
			.innerJoin(terms, eq(graduationDates.termId, terms.id))
			.orderBy(desc(graduationDates.date));
	}

	async getGraduationDateById(id: number) {
		const [result] = await db
			.select({
				id: graduationDates.id,
				date: graduationDates.date,
				termCode: terms.code,
			})
			.from(graduationDates)
			.innerJoin(terms, eq(graduationDates.termId, terms.id))
			.where(eq(graduationDates.id, id))
			.limit(1);

		return result;
	}

	async getFullGraduationData(
		filter?: GraduationReportFilter
	): Promise<GraduationStudent[]> {
		const query = this.createBaseStudentQuery();
		const conditions = this.buildFilterConditions(filter);

		const result = await query
			.where(and(...conditions))
			.orderBy(schools.name, programs.name, students.name);

		return result.map((row) =>
			this.mapRowToStudent(row as unknown as StudentQueryRow)
		);
	}

	async getPaginatedGraduationData(
		page: number = 1,
		pageSize: number = 20,
		filter?: GraduationReportFilter
	): Promise<{
		students: GraduationStudent[];
		totalCount: number;
		totalPages: number;
		currentPage: number;
	}> {
		const offset = (page - 1) * pageSize;

		const studentsQuery = this.createBaseStudentQuery();
		const countQuery = this.createCountQuery();

		const conditions = this.buildFilterConditions(filter, {
			includeSearchQuery: true,
		});

		const whereClause = and(...conditions);

		const [studentsResult, totalResult] = await Promise.all([
			studentsQuery
				.where(whereClause)
				.orderBy(schools.name, programs.name, students.name)
				.limit(pageSize)
				.offset(offset),
			countQuery.where(whereClause),
		]);

		const totalCount = totalResult.length;
		const totalPages = Math.ceil(totalCount / pageSize);

		return {
			students: studentsResult.map((row) =>
				this.mapRowToStudent(row as unknown as StudentQueryRow)
			),
			totalCount,
			totalPages,
			currentPage: page,
		};
	}

	async getSummaryGraduationData(
		filter?: GraduationReportFilter
	): Promise<GraduationSummaryReport> {
		const fullData = await this.getFullGraduationData(filter);
		const { schoolsMap, programsMap } = this.processSummaryData(fullData);
		const graduationDate = filter?.graduationMonth || 'All Dates';
		return this.buildSummaryReport(
			graduationDate,
			fullData,
			schoolsMap,
			programsMap
		);
	}

	async getChartData(
		filter?: GraduationReportFilter
	): Promise<GraduationChartData> {
		const query = this.createChartQuery();
		const conditions = this.buildFilterConditions(filter);

		const result = await query.where(and(...conditions));
		return this.aggregateChartData(result as unknown as ChartQueryRow[]);
	}

	async getAvailableCountries() {
		const result = await db
			.selectDistinct({ country: students.country })
			.from(students)
			.innerJoin(studentPrograms, eq(students.stdNo, studentPrograms.stdNo))
			.where(
				and(
					isNotNull(studentPrograms.graduationDate),
					sql`${studentPrograms.graduationDate} != ''`,
					isNotNull(students.country),
					sql`${students.country} != ''`
				)
			)
			.orderBy(students.country);

		return result.map((row) => row.country).filter((c): c is string => !!c);
	}
}
