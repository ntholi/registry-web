import { and, eq, inArray, sql } from 'drizzle-orm';
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
import {
	AGE_GROUPS,
	DISTRIBUTION_COLORS,
	type DistributionBreakdown,
	type DistributionDataPoint,
	type DistributionReportFilter,
	type DistributionResult,
	type DistributionType,
} from '../types';

interface StudentRow {
	schoolName: string;
	schoolCode: string;
	programName: string;
	programCode: string;
	programLevel: string;
	semesterNumber: string | null;
	gender: string | null;
	sponsorName: string | null;
	dateOfBirth: Date | null;
	country: string | null;
	semesterStatus: string;
}

export class DistributionReportRepository {
	private createBaseQuery() {
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

	private buildFilterConditions(filter?: DistributionReportFilter) {
		const conditions = [
			eq(studentPrograms.status, 'Active'),
			inArray(studentSemesters.status, ['Active', 'Repeat']),
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

		return conditions;
	}

	private getValueExtractor(
		type: DistributionType
	): (row: StudentRow) => string {
		const currentDate = new Date();

		switch (type) {
			case 'gender':
				return (row) => row.gender || 'Unknown';
			case 'country':
				return (row) => row.country || 'Unknown';
			case 'sponsor':
				return (row) => row.sponsorName || 'Self-Sponsored';
			case 'program-level':
				return (row) => {
					const level = row.programLevel || 'Unknown';
					const labels: Record<string, string> = {
						certificate: 'Certificate',
						diploma: 'Diploma',
						degree: 'Degree',
					};
					return labels[level] || level;
				};
			case 'semester':
				return (row) => {
					const sem = row.semesterNumber;
					if (!sem) return 'Unknown';
					const semNumber = Number.parseInt(sem, 10);
					if (Number.isNaN(semNumber)) return sem;
					const year = Math.ceil(semNumber / 2);
					const semester = semNumber % 2 === 0 ? 2 : 1;
					return `Y${year}S${semester}`;
				};
			case 'age-group':
				return (row) => {
					if (!row.dateOfBirth) return 'Unknown';
					const birthDate = new Date(row.dateOfBirth);
					const age = Math.floor(
						(currentDate.getTime() - birthDate.getTime()) /
							(365.25 * 24 * 60 * 60 * 1000)
					);
					const group = AGE_GROUPS.find((g) => age >= g.min && age <= g.max);
					return group?.label || 'Unknown';
				};
			case 'semester-status':
				return (row) =>
					row.semesterStatus === 'DroppedOut'
						? 'Dropped Out'
						: row.semesterStatus || 'Unknown';
			default:
				return () => 'Unknown';
		}
	}

	private aggregateByCategory(
		rows: StudentRow[],
		categoryExtractor: (row: StudentRow) => string,
		valueExtractor: (row: StudentRow) => string
	): DistributionBreakdown[] {
		const categoryMap = new Map<
			string,
			{ data: Map<string, number>; total: number }
		>();

		for (const row of rows) {
			const category = categoryExtractor(row);
			const value = valueExtractor(row);

			if (!categoryMap.has(category)) {
				categoryMap.set(category, { data: new Map(), total: 0 });
			}

			const categoryData = categoryMap.get(category)!;
			categoryData.data.set(value, (categoryData.data.get(value) || 0) + 1);
			categoryData.total++;
		}

		return Array.from(categoryMap.entries())
			.map(([category, { data, total }]) => ({
				category,
				total,
				data: Array.from(data.entries())
					.map(([name, value]) => ({
						name,
						value,
						color: DISTRIBUTION_COLORS[name] || undefined,
					}))
					.sort((a, b) => b.value - a.value),
			}))
			.sort((a, b) => b.total - a.total);
	}

	private aggregateOverview(
		rows: StudentRow[],
		valueExtractor: (row: StudentRow) => string
	): DistributionDataPoint[] {
		const valueMap = new Map<string, number>();

		for (const row of rows) {
			const value = valueExtractor(row);
			valueMap.set(value, (valueMap.get(value) || 0) + 1);
		}

		return Array.from(valueMap.entries())
			.map(([name, value]) => ({
				name,
				value,
				color: DISTRIBUTION_COLORS[name] || undefined,
			}))
			.sort((a, b) => b.value - a.value);
	}

	async getDistributionData(
		type: DistributionType,
		termNames: string[],
		filter?: DistributionReportFilter
	): Promise<DistributionResult> {
		const query = this.createBaseQuery();
		const conditions = [
			inArray(studentSemesters.term, termNames),
			...this.buildFilterConditions(filter),
		];

		const rows = await query.where(and(...conditions));
		const valueExtractor = this.getValueExtractor(type);

		const labels: Record<DistributionType, string> = {
			gender: 'Gender Distribution',
			country: 'Country/Nationality Distribution',
			sponsor: 'Sponsor Distribution',
			'program-level': 'Program Level Distribution',
			semester: 'Semester Distribution',
			'age-group': 'Age Group Distribution',
			'semester-status': 'Semester Status Distribution',
		};

		const programBreakdown = this.aggregateByCategory(
			rows,
			(row) => row.programCode,
			valueExtractor
		);

		return {
			type,
			label: labels[type],
			total: rows.length,
			overview: this.aggregateOverview(rows, valueExtractor),
			bySchool: this.aggregateByCategory(
				rows,
				(row) => row.schoolCode,
				valueExtractor
			),
			byProgram: programBreakdown,
			bySemester: this.aggregateByCategory(
				rows,
				(row) => {
					const sem = row.semesterNumber;
					if (!sem) return 'Unknown';
					const semNumber = Number.parseInt(sem, 10);
					if (Number.isNaN(semNumber)) return sem;
					const year = Math.ceil(semNumber / 2);
					const semester = semNumber % 2 === 0 ? 2 : 1;
					return `Y${year}S${semester}`;
				},
				valueExtractor
			).sort((a, b) => {
				const aMatch = a.category.match(/^Y(\d+)S(\d+)$/);
				const bMatch = b.category.match(/^Y(\d+)S(\d+)$/);
				if (!aMatch && !bMatch) return 0;
				if (!aMatch) return 1;
				if (!bMatch) return -1;
				const aYear = parseInt(aMatch[1], 10);
				const bYear = parseInt(bMatch[1], 10);
				if (aYear !== bYear) return aYear - bYear;
				const aSem = parseInt(aMatch[2], 10);
				const bSem = parseInt(bMatch[2], 10);
				return aSem - bSem;
			}),
			bySemesterStatus: this.aggregateByCategory(
				rows,
				(row) =>
					row.semesterStatus === 'DroppedOut'
						? 'Dropped Out'
						: row.semesterStatus,
				valueExtractor
			),
		};
	}

	async getTermsByIds(termIds: number[]) {
		return await db.select().from(terms).where(inArray(terms.id, termIds));
	}

	async getAllActiveTerms() {
		return await db.select().from(terms).orderBy(sql`${terms.name} DESC`);
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
				.orderBy(programs.code);
		}

		return await baseQuery.orderBy(programs.code);
	}
}
