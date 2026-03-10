import type { ProgramLevel } from '@academic/_database';
import type { SemesterStatus } from '@registry/_database';
import { and, eq, ilike, inArray, or, type SQL, sql } from 'drizzle-orm';
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
import { compareSemesters } from '@/shared/lib/utils/utils';

export type ProgressionCategory =
	| 'Progressed'
	| 'Remained'
	| 'Not Enrolled'
	| 'Graduated'
	| 'Dropped Out'
	| 'Deferred'
	| 'Terminated/Suspended';

export interface ProgressionFilter {
	schoolIds?: number[];
	programId?: number;
	programLevels?: ProgramLevel[];
	searchQuery?: string;
	gender?: string;
	sponsorId?: number;
	ageRangeMin?: number;
	ageRangeMax?: number;
	country?: string;
	studentStatus?: string;
	programStatus?: string;
	semesterStatuses?: string[];
	category?: ProgressionCategory;
}

export interface ProgressionStudent {
	stdNo: number;
	name: string;
	programName: string;
	previousSemester: string;
	currentSemester: string | null;
	category: ProgressionCategory;
	schoolCode: string;
	schoolName: string;
	gender: string | null;
	country: string | null;
	sponsorName: string | null;
}

export interface ProgressionSummaryProgram {
	programName: string;
	totalPrevious: number;
	progressed: number;
	remained: number;
	notEnrolled: number;
	graduated: number;
	droppedOut: number;
	deferred: number;
	terminated: number;
	progressionRate: number;
}

export interface ProgressionSummarySchool {
	schoolName: string;
	schoolCode: string;
	totalPrevious: number;
	progressed: number;
	remained: number;
	notEnrolled: number;
	graduated: number;
	droppedOut: number;
	deferred: number;
	terminated: number;
	progressionRate: number;
	programs: ProgressionSummaryProgram[];
}

interface ProgressionChartCategoryItem {
	category: ProgressionCategory;
	count: number;
}

interface ProgressionChartSchoolItem {
	name: string;
	code: string;
	progressed: number;
	notProgressed: number;
}

interface ProgressionChartProgramItem {
	name: string;
	total: number;
	progressed: number;
	rate: number;
}

interface ProgressionChartSemesterItem {
	semester: string;
	total: number;
	progressed: number;
	rate: number;
}

export interface ProgressionChartData {
	totalStudents: number;
	byCategory: ProgressionChartCategoryItem[];
	bySchool: ProgressionChartSchoolItem[];
	byProgram: ProgressionChartProgramItem[];
	bySemester: ProgressionChartSemesterItem[];
}

interface PrevSemRow {
	stdNo: number;
	name: string;
	programName: string;
	schoolName: string;
	schoolCode: string;
	previousSemester: string | null;
	studentProgramId: number;
	gender: string | null;
	country: string | null;
	sponsorName: string | null;
	studentStatus: string | null;
	programStatus: string | null;
	semesterStatus: string;
	dateOfBirth: Date | null;
}

const prevSem = studentSemesters;

export class ProgressionReportRepository {
	async getTermById(termId: number) {
		const [term] = await db
			.select({ id: terms.id, code: terms.code })
			.from(terms)
			.where(eq(terms.id, termId))
			.limit(1);

		return term ?? null;
	}

	private createPrevTermQuery() {
		return db
			.select({
				stdNo: students.stdNo,
				name: students.name,
				programName: programs.name,
				schoolName: schools.name,
				schoolCode: schools.code,
				previousSemester: structureSemesters.semesterNumber,
				studentProgramId: prevSem.studentProgramId,
				gender: students.gender,
				country: students.country,
				sponsorName: sponsors.name,
				studentStatus: students.status,
				programStatus: studentPrograms.status,
				semesterStatus: prevSem.status,
				dateOfBirth: students.dateOfBirth,
			})
			.from(prevSem)
			.innerJoin(
				structureSemesters,
				eq(prevSem.structureSemesterId, structureSemesters.id)
			)
			.innerJoin(
				studentPrograms,
				eq(prevSem.studentProgramId, studentPrograms.id)
			)
			.innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
			.innerJoin(structures, eq(studentPrograms.structureId, structures.id))
			.innerJoin(programs, eq(structures.programId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.leftJoin(sponsors, eq(prevSem.sponsorId, sponsors.id));
	}

	private buildFilterConditions(
		filter: ProgressionFilter | undefined,
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

		if (filter?.semesterStatuses && filter.semesterStatuses.length > 0) {
			conditions.push(
				inArray(prevSem.status, filter.semesterStatuses as SemesterStatus[])
			);
		} else {
			conditions.push(
				inArray(prevSem.status, [
					'Active',
					'Enrolled',
					'Exempted',
					'Outstanding',
					'Repeat',
					'DNR',
				])
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
			conditions.push(eq(prevSem.sponsorId, filter.sponsorId));
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

	private categorizeStudent(
		row: PrevSemRow,
		currSemRow: { semesterNumber: string | null } | null
	): ProgressionCategory {
		if (
			row.studentStatus === 'Graduated' ||
			row.programStatus === 'Completed'
		) {
			return 'Graduated';
		}

		if (
			row.studentStatus === 'Terminated' ||
			row.studentStatus === 'Suspended'
		) {
			return 'Terminated/Suspended';
		}

		if (row.studentStatus === 'Withdrawn') {
			return 'Dropped Out';
		}

		if (
			row.semesterStatus === 'DroppedOut' ||
			row.semesterStatus === 'Withdrawn'
		) {
			return 'Dropped Out';
		}

		if (row.semesterStatus === 'Deferred') {
			return 'Deferred';
		}

		if (!currSemRow || !currSemRow.semesterNumber) {
			return 'Not Enrolled';
		}

		const prevSemNum = row.previousSemester ?? '';
		const currSemNum = currSemRow.semesterNumber;
		const cmp = compareSemesters(currSemNum, prevSemNum);

		if (cmp > 0) {
			return 'Progressed';
		}

		return 'Remained';
	}

	private async fetchProgressionRows(
		prevTermCode: string,
		currTermCode: string,
		filter?: ProgressionFilter
	): Promise<ProgressionStudent[]> {
		const conditions = [
			eq(prevSem.termCode, prevTermCode),
			...this.buildFilterConditions(filter),
		];

		const prevRows = (await this.createPrevTermQuery().where(
			and(...conditions)
		)) as PrevSemRow[];

		if (prevRows.length === 0) {
			return [];
		}

		const spIds = [...new Set(prevRows.map((row) => row.studentProgramId))];

		const currRows = await db
			.select({
				studentProgramId: studentSemesters.studentProgramId,
				semesterNumber: structureSemesters.semesterNumber,
			})
			.from(studentSemesters)
			.innerJoin(
				structureSemesters,
				eq(studentSemesters.structureSemesterId, structureSemesters.id)
			)
			.where(
				and(
					eq(studentSemesters.termCode, currTermCode),
					inArray(studentSemesters.studentProgramId, spIds)
				)
			);

		const currMap = new Map(currRows.map((row) => [row.studentProgramId, row]));
		const result: ProgressionStudent[] = [];

		for (const row of prevRows) {
			const currSemRow = currMap.get(row.studentProgramId) ?? null;
			const category = this.categorizeStudent(row, currSemRow);

			if (filter?.category && category !== filter.category) {
				continue;
			}

			result.push({
				stdNo: row.stdNo,
				name: row.name,
				programName: row.programName,
				previousSemester: row.previousSemester ?? '',
				currentSemester: currSemRow?.semesterNumber ?? null,
				category,
				schoolCode: row.schoolCode,
				schoolName: row.schoolName,
				gender: row.gender,
				country: row.country,
				sponsorName: row.sponsorName,
			});
		}

		return result;
	}

	async getProgressionSummary(
		prevTermCode: string,
		currTermCode: string,
		filter?: ProgressionFilter
	): Promise<ProgressionSummarySchool[]> {
		const rows = await this.fetchProgressionRows(
			prevTermCode,
			currTermCode,
			filter
		);

		const schoolMap = new Map<string, ProgressionSummarySchool>();
		const programMap = new Map<
			string,
			ProgressionSummaryProgram & { schoolName: string }
		>();

		for (const row of rows) {
			const schoolKey = row.schoolName;

			if (!schoolMap.has(schoolKey)) {
				schoolMap.set(schoolKey, {
					schoolName: row.schoolName,
					schoolCode: row.schoolCode,
					totalPrevious: 0,
					progressed: 0,
					remained: 0,
					notEnrolled: 0,
					graduated: 0,
					droppedOut: 0,
					deferred: 0,
					terminated: 0,
					progressionRate: 0,
					programs: [],
				});
			}

			const programKey = `${row.programName}|${row.schoolName}`;
			if (!programMap.has(programKey)) {
				programMap.set(programKey, {
					programName: row.programName,
					schoolName: row.schoolName,
					totalPrevious: 0,
					progressed: 0,
					remained: 0,
					notEnrolled: 0,
					graduated: 0,
					droppedOut: 0,
					deferred: 0,
					terminated: 0,
					progressionRate: 0,
				});
			}

			const school = schoolMap.get(schoolKey)!;
			const program = programMap.get(programKey)!;

			school.totalPrevious++;
			program.totalPrevious++;

			switch (row.category) {
				case 'Progressed':
					school.progressed++;
					program.progressed++;
					break;
				case 'Remained':
					school.remained++;
					program.remained++;
					break;
				case 'Not Enrolled':
					school.notEnrolled++;
					program.notEnrolled++;
					break;
				case 'Graduated':
					school.graduated++;
					program.graduated++;
					break;
				case 'Dropped Out':
					school.droppedOut++;
					program.droppedOut++;
					break;
				case 'Deferred':
					school.deferred++;
					program.deferred++;
					break;
				case 'Terminated/Suspended':
					school.terminated++;
					program.terminated++;
					break;
			}
		}

		for (const program of programMap.values()) {
			program.progressionRate =
				program.totalPrevious > 0
					? Math.round((program.progressed / program.totalPrevious) * 100)
					: 0;
		}

		const result: ProgressionSummarySchool[] = [];

		for (const school of schoolMap.values()) {
			school.progressionRate =
				school.totalPrevious > 0
					? Math.round((school.progressed / school.totalPrevious) * 100)
					: 0;

			school.programs = Array.from(programMap.values())
				.filter((program) => program.schoolName === school.schoolName)
				.map(({ schoolName: _schoolName, ...rest }) => rest)
				.sort((left, right) =>
					left.programName.localeCompare(right.programName)
				);

			result.push(school);
		}

		return result.sort((left, right) =>
			left.schoolName.localeCompare(right.schoolName)
		);
	}

	async getPaginatedProgressionData(
		prevTermCode: string,
		currTermCode: string,
		page: number,
		pageSize: number,
		filter?: ProgressionFilter
	): Promise<{
		students: ProgressionStudent[];
		totalCount: number;
		totalPages: number;
		currentPage: number;
	}> {
		const allRows = await this.fetchProgressionRows(
			prevTermCode,
			currTermCode,
			{ ...filter, category: undefined }
		);

		let filtered = allRows;

		if (filter?.category) {
			filtered = allRows.filter((row) => row.category === filter.category);
		}

		if (filter?.searchQuery?.trim()) {
			const query = filter.searchQuery.trim().toLowerCase();
			filtered = filtered.filter(
				(row) =>
					String(row.stdNo).includes(query) ||
					row.name.toLowerCase().includes(query) ||
					row.programName.toLowerCase().includes(query) ||
					row.schoolName.toLowerCase().includes(query) ||
					row.schoolCode.toLowerCase().includes(query)
			);
		}

		const totalCount = filtered.length;
		const totalPages = Math.ceil(totalCount / pageSize);
		const offset = (page - 1) * pageSize;
		const paginated = filtered.slice(offset, offset + pageSize);

		return {
			students: paginated,
			totalCount,
			totalPages,
			currentPage: page,
		};
	}

	async getProgressionChartData(
		prevTermCode: string,
		currTermCode: string,
		filter?: ProgressionFilter
	): Promise<ProgressionChartData> {
		const rows = await this.fetchProgressionRows(
			prevTermCode,
			currTermCode,
			filter
		);

		const categoryMap = new Map<ProgressionCategory, number>();
		const schoolDataMap = new Map<
			string,
			{ code: string; progressed: number; notProgressed: number }
		>();
		const programDataMap = new Map<
			string,
			{ total: number; progressed: number }
		>();
		const semesterDataMap = new Map<
			string,
			{ total: number; progressed: number }
		>();

		for (const row of rows) {
			categoryMap.set(row.category, (categoryMap.get(row.category) ?? 0) + 1);

			if (!schoolDataMap.has(row.schoolName)) {
				schoolDataMap.set(row.schoolName, {
					code: row.schoolCode,
					progressed: 0,
					notProgressed: 0,
				});
			}

			const school = schoolDataMap.get(row.schoolName)!;
			if (row.category === 'Progressed') {
				school.progressed++;
			} else {
				school.notProgressed++;
			}

			if (!programDataMap.has(row.programName)) {
				programDataMap.set(row.programName, { total: 0, progressed: 0 });
			}

			const program = programDataMap.get(row.programName)!;
			program.total++;
			if (row.category === 'Progressed') {
				program.progressed++;
			}

			const semester = row.previousSemester || 'Unknown';
			if (!semesterDataMap.has(semester)) {
				semesterDataMap.set(semester, { total: 0, progressed: 0 });
			}

			const semesterData = semesterDataMap.get(semester)!;
			semesterData.total++;
			if (row.category === 'Progressed') {
				semesterData.progressed++;
			}
		}

		const allCategories: ProgressionCategory[] = [
			'Progressed',
			'Remained',
			'Not Enrolled',
			'Graduated',
			'Dropped Out',
			'Deferred',
			'Terminated/Suspended',
		];

		return {
			totalStudents: rows.length,
			byCategory: allCategories
				.map((category) => ({
					category,
					count: categoryMap.get(category) ?? 0,
				}))
				.filter((item) => item.count > 0),
			bySchool: Array.from(schoolDataMap.entries())
				.map(([name, data]) => ({
					name,
					code: data.code,
					progressed: data.progressed,
					notProgressed: data.notProgressed,
				}))
				.sort(
					(left, right) =>
						right.progressed +
						right.notProgressed -
						(left.progressed + left.notProgressed)
				),
			byProgram: Array.from(programDataMap.entries())
				.map(([name, data]) => ({
					name,
					total: data.total,
					progressed: data.progressed,
					rate:
						data.total > 0
							? Math.round((data.progressed / data.total) * 100)
							: 0,
				}))
				.sort((left, right) => right.rate - left.rate),
			bySemester: Array.from(semesterDataMap.entries())
				.map(([semester, data]) => ({
					semester,
					total: data.total,
					progressed: data.progressed,
					rate:
						data.total > 0
							? Math.round((data.progressed / data.total) * 100)
							: 0,
				}))
				.sort((left, right) => compareSemesters(left.semester, right.semester)),
		};
	}
}

export const progressionReportRepository = new ProgressionReportRepository();
