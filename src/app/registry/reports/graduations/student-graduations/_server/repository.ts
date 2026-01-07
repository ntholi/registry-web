import type { ProgramLevel } from '@academic/_database/schema/enums';
import { and, eq, ilike, inArray, isNotNull, or, sql, type SQL } from 'drizzle-orm';
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
} from '@/core/database';
import type {
	GraduatedStudent,
	GraduationChartData,
	GraduationsFilter,
	GraduationSummaryStats,
	SummaryProgramData,
	SummarySchoolData,
} from '../_lib/types';

interface StudentQueryRow {
	stdNo: number;
	name: string;
	programName: string;
	semesterNumber: string | null;
	schoolName: string;
	schoolCode: string;
	sponsorName: string | null;
	graduationDate: string;
	gender: string | null;
	dateOfBirth: Date | null;
	country: string | null;
	programLevel: string | null;
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
	studentId: number;
}

export class GraduationReportRepository {
	private createBaseStudentQuery() {
		return db
			.select({
				stdNo: students.stdNo,
				name: students.name,
				programName: programs.name,
				semesterNumber: structureSemesters.semesterNumber,
				schoolName: schools.name,
				schoolCode: schools.code,
				sponsorName: sponsors.name,
				graduationDate: studentPrograms.graduationDate,
				gender: students.gender,
				dateOfBirth: students.dateOfBirth,
				country: students.country,
				programLevel: programs.level,
				regDate: studentPrograms.regDate,
				intakeDate: studentPrograms.intakeDate,
			})
			.from(studentPrograms)
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.leftJoin(
				structureSemesters,
				eq(structureSemesters.structureId, structures.id)
			)
			.leftJoin(
				studentSemesters,
				and(
					eq(studentSemesters.studentProgramId, studentPrograms.id),
					eq(studentSemesters.structureSemesterId, structureSemesters.id)
				)
			)
			.leftJoin(sponsors, eq(studentSemesters.sponsorId, sponsors.id));
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
				studentId: students.stdNo,
			})
			.from(studentPrograms)
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id));
	}

	private buildFilterConditions(
		filter: GraduationsFilter | undefined,
		options: { includeSearchQuery?: boolean } = {}
	): SQL[] {
		const conditions: SQL[] = [isNotNull(studentPrograms.graduationDate)];

		if (filter?.graduationDate) {
			const yearMonth = filter.graduationDate.substring(0, 7);
			conditions.push(
				sql`SUBSTRING(${studentPrograms.graduationDate}, 1, 7) = ${yearMonth}`
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
			conditions.push(eq(studentSemesters.sponsorId, filter.sponsorId));
		}

		if (filter?.country) {
			conditions.push(eq(students.country, filter.country));
		}

		if (filter?.ageRangeMin || filter?.ageRangeMax) {
			if (filter.graduationDate) {
				const gradDate = new Date(filter.graduationDate);
				if (filter.ageRangeMin) {
					const maxBirthDate = new Date(
						gradDate.getFullYear() - filter.ageRangeMin,
						gradDate.getMonth(),
						gradDate.getDate()
					);
					conditions.push(sql`${students.dateOfBirth} <= ${maxBirthDate}`);
				}
				if (filter.ageRangeMax) {
					const minBirthDate = new Date(
						gradDate.getFullYear() - filter.ageRangeMax - 1,
						gradDate.getMonth(),
						gradDate.getDate()
					);
					conditions.push(sql`${students.dateOfBirth} >= ${minBirthDate}`);
				}
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

	private mapRowToStudent(row: StudentQueryRow): GraduatedStudent {
		let age: number | null = null;
		if (row.dateOfBirth && row.graduationDate) {
			const birthDate = new Date(row.dateOfBirth);
			const gradDate = new Date(row.graduationDate);
			age = Math.floor(
				(gradDate.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
			);
		}

		let timeToGraduate: number | null = null;
		if (row.graduationDate) {
			const gradDate = new Date(row.graduationDate);
			const startDate = row.regDate
				? new Date(row.regDate)
				: row.intakeDate
					? new Date(row.intakeDate)
					: null;

			if (startDate) {
				const months = Math.floor(
					(gradDate.getTime() - startDate.getTime()) /
						(30.44 * 24 * 60 * 60 * 1000)
				);
				timeToGraduate = months;
			}
		}

		return {
			stdNo: row.stdNo,
			name: row.name,
			programName: row.programName,
			semesterNumber: row.semesterNumber || '',
			schoolName: row.schoolName,
			schoolCode: row.schoolCode,
			sponsorName: row.sponsorName || null,
			graduationDate: row.graduationDate,
			gender: row.gender || null,
			programLevel: row.programLevel || null,
			country: row.country || null,
			age,
			timeToGraduate,
		};
	}

	private processSummaryData(fullData: GraduatedStudent[]): {
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
					totalGraduates: 0,
					programs: [],
				});
			}

			if (!programsMap.has(programKey)) {
				programsMap.set(programKey, {
					programName: student.programName,
					schoolName: student.schoolName,
					schoolCode: student.schoolCode,
					totalGraduates: 0,
				});
			}

			const program = programsMap.get(programKey)!;
			program.totalGraduates++;

			const school = schoolsMap.get(schoolKey)!;
			school.totalGraduates++;
		});

		return { schoolsMap, programsMap };
	}

	private calculateStats(fullData: GraduatedStudent[]): GraduationSummaryStats {
		const genderMap = new Map<string, number>();
		const levelMap = new Map<string, number>();
		let totalAge = 0;
		let ageCount = 0;
		let totalTime = 0;
		let timeCount = 0;

		fullData.forEach((student) => {
			const gender = student.gender || 'Unknown';
			genderMap.set(gender, (genderMap.get(gender) || 0) + 1);

			const level = student.programLevel || 'Unknown';
			levelMap.set(level, (levelMap.get(level) || 0) + 1);

			if (student.age !== null) {
				totalAge += student.age;
				ageCount++;
			}

			if (student.timeToGraduate !== null) {
				totalTime += student.timeToGraduate;
				timeCount++;
			}
		});

		return {
			totalGraduates: fullData.length,
			byGender: Array.from(genderMap.entries())
				.map(([gender, count]) => ({ gender, count }))
				.sort((a, b) => b.count - a.count),
			byLevel: Array.from(levelMap.entries())
				.map(([level, count]) => ({ level, count }))
				.sort((a, b) => b.count - a.count),
			averageAge: ageCount > 0 ? Math.round(totalAge / ageCount) : null,
			averageTimeToGraduate: timeCount > 0 ? Math.round(totalTime / timeCount) : null,
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

			const gender = row.gender || 'Unknown';
			genderMap.set(gender, (genderMap.get(gender) || 0) + 1);

			const programLevel = row.programLevel || 'Unknown';
			programLevelMap.set(
				programLevel,
				(programLevelMap.get(programLevel) || 0) + 1
			);
		});

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
			graduatesByLevel: Array.from(programLevelMap.entries())
				.map(([level, count]) => ({ level, count }))
				.sort((a, b) => b.count - a.count),
		};
	}

	async getFullGraduationData(
		filter?: GraduationsFilter
	): Promise<GraduatedStudent[]> {
		const query = this.createBaseStudentQuery();
		const conditions = this.buildFilterConditions(filter);

		const result = await query
			.where(and(...conditions))
			.orderBy(schools.name, programs.name);

		const uniqueStudents = new Map<number, StudentQueryRow>();
		result.forEach((row) => {
			if (!uniqueStudents.has(row.stdNo)) {
				uniqueStudents.set(row.stdNo, row);
			}
		});

		return Array.from(uniqueStudents.values()).map((row) =>
			this.mapRowToStudent(row)
		);
	}

	async getPaginatedGraduationData(
		page: number = 1,
		pageSize: number = 20,
		filter?: GraduationsFilter
	): Promise<{
		students: GraduatedStudent[];
		totalCount: number;
		totalPages: number;
		currentPage: number;
	}> {
		const fullData = await this.getFullGraduationData(filter);

		const uniqueStudents = new Map<number, GraduatedStudent>();
		fullData.forEach((student) => {
			if (!uniqueStudents.has(student.stdNo)) {
				uniqueStudents.set(student.stdNo, student);
			}
		});

		let students = Array.from(uniqueStudents.values());

		if (filter?.searchQuery?.trim()) {
			const searchLower = filter.searchQuery.trim().toLowerCase();
			students = students.filter(
				(s) =>
					s.stdNo.toString().includes(searchLower) ||
					s.name.toLowerCase().includes(searchLower) ||
					s.programName.toLowerCase().includes(searchLower) ||
					s.schoolName.toLowerCase().includes(searchLower) ||
					s.schoolCode.toLowerCase().includes(searchLower)
			);
		}

		const totalCount = students.length;
		const totalPages = Math.ceil(totalCount / pageSize);
		const offset = (page - 1) * pageSize;

		return {
			students: students.slice(offset, offset + pageSize),
			totalCount,
			totalPages,
			currentPage: page,
		};
	}

	async getSummaryGraduationData(filter?: GraduationsFilter): Promise<{
		totalGraduates: number;
		schools: SummarySchoolData[];
		stats: GraduationSummaryStats;
		generatedAt: Date;
	}> {
		const fullData = await this.getFullGraduationData(filter);
		const { schoolsMap, programsMap } = this.processSummaryData(fullData);
		const stats = this.calculateStats(fullData);

		const schoolsList = Array.from(schoolsMap.values())
			.map((school) => ({
				...school,
				programs: Array.from(programsMap.values())
					.filter((program) => program.schoolName === school.schoolName)
					.sort((a, b) => a.programName.localeCompare(b.programName)),
			}))
			.sort((a, b) => a.schoolName.localeCompare(b.schoolName));

		return {
			totalGraduates: fullData.length,
			schools: schoolsList,
			stats,
			generatedAt: new Date(),
		};
	}

	async getChartData(filter?: GraduationsFilter): Promise<GraduationChartData> {
		const query = this.createChartQuery();
		const conditions = this.buildFilterConditions(filter);

		const result = await query.where(and(...conditions));
		return this.aggregateChartData(result);
	}
}
