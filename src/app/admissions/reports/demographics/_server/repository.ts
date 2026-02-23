import { and, count, eq, inArray, type SQL, sql } from 'drizzle-orm';
import {
	applicants,
	applications,
	db,
	programs,
	schools,
} from '@/core/database';
import type { AdmissionReportFilter } from '../../_shared/types';

export const AGE_GROUPS = [
	{ min: 12, max: 15, label: '12+' },
	{ min: 16, max: 16, label: '16' },
	{ min: 17, max: 17, label: '17' },
	{ min: 18, max: 19, label: '18-19' },
	{ min: 20, max: 25, label: '20-25' },
	{ min: 26, max: 35, label: '26-35' },
	{ min: 36, max: 200, label: '36+' },
];

export interface DemographicsOverview {
	gender: Array<{ name: string; value: number; color: string }>;
	nationality: Array<{ name: string; value: number }>;
	ageGroup: Array<{ name: string; value: number }>;
	total: number;
}

export interface SchoolDemographics {
	schoolName: string;
	schoolId: number;
	gender: Array<{ name: string; value: number; color: string }>;
	nationality: Array<{ name: string; value: number }>;
	total: number;
}

function buildConditions(filter: AdmissionReportFilter): SQL[] {
	const conditions: SQL[] = [];
	if (filter.intakePeriodId) {
		conditions.push(eq(applications.intakePeriodId, filter.intakePeriodId));
	}
	if (filter.schoolIds?.length) {
		conditions.push(inArray(programs.schoolId, filter.schoolIds));
	}
	if (filter.programId) {
		conditions.push(eq(applications.firstChoiceProgramId, filter.programId));
	}
	if (filter.programLevels?.length) {
		conditions.push(inArray(programs.level, filter.programLevels));
	}
	if (filter.applicationStatuses?.length) {
		conditions.push(inArray(applications.status, filter.applicationStatuses));
	}
	return conditions;
}

export class DemographicsRepository {
	async getOverview(
		filter: AdmissionReportFilter
	): Promise<DemographicsOverview> {
		const conditions = buildConditions(filter);
		const whereClause = conditions.length ? and(...conditions) : undefined;

		const genderRows = await db
			.select({
				gender: applicants.gender,
				count: count(),
			})
			.from(applications)
			.innerJoin(applicants, eq(applications.applicantId, applicants.id))
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(whereClause)
			.groupBy(applicants.gender);

		const genderColorMap: Record<string, string> = {
			Male: 'blue.6',
			Female: 'pink.6',
		};

		const gender = genderRows.map((r) => ({
			name: r.gender ?? 'Unknown',
			value: r.count,
			color: genderColorMap[r.gender ?? ''] ?? 'gray.6',
		}));

		const natRows = await db
			.select({
				nationality: applicants.nationality,
				count: count(),
			})
			.from(applications)
			.innerJoin(applicants, eq(applications.applicantId, applicants.id))
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(whereClause)
			.groupBy(applicants.nationality)
			.orderBy(sql`count(*) DESC`)
			.limit(15);

		const nationality = natRows.map((r) => ({
			name: r.nationality ?? 'Unknown',
			value: r.count,
		}));

		const ageRows = await db
			.select({
				dob: applicants.dateOfBirth,
			})
			.from(applications)
			.innerJoin(applicants, eq(applications.applicantId, applicants.id))
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(whereClause);

		const ageCounts: Record<string, number> = {};
		for (const group of AGE_GROUPS) {
			ageCounts[group.label] = 0;
		}

		for (const row of ageRows) {
			if (!row.dob) continue;
			const age = Math.floor(
				(Date.now() - new Date(row.dob).getTime()) /
					(365.25 * 24 * 60 * 60 * 1000)
			);
			const group = AGE_GROUPS.find((g) => age >= g.min && age <= g.max);
			if (group) ageCounts[group.label]++;
		}

		const ageGroup = AGE_GROUPS.map((g) => ({
			name: g.label,
			value: ageCounts[g.label],
		}));

		const total = gender.reduce((s, g) => s + g.value, 0);

		return { gender, nationality, ageGroup, total };
	}

	async getBySchool(
		filter: AdmissionReportFilter
	): Promise<SchoolDemographics[]> {
		const conditions = buildConditions(filter);
		const whereClause = conditions.length ? and(...conditions) : undefined;

		const rows = await db
			.select({
				schoolName: schools.code,
				schoolId: schools.id,
				gender: applicants.gender,
				nationality: applicants.nationality,
				count: count(),
			})
			.from(applications)
			.innerJoin(applicants, eq(applications.applicantId, applicants.id))
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(whereClause)
			.groupBy(
				schools.id,
				schools.code,
				applicants.gender,
				applicants.nationality
			);

		const schoolMap = new Map<number, SchoolDemographics>();

		const genderColorMap: Record<string, string> = {
			Male: 'blue.6',
			Female: 'pink.6',
		};

		for (const row of rows) {
			if (!schoolMap.has(row.schoolId)) {
				schoolMap.set(row.schoolId, {
					schoolName: row.schoolName,
					schoolId: row.schoolId,
					gender: [],
					nationality: [],
					total: 0,
				});
			}
			const school = schoolMap.get(row.schoolId)!;
			school.total += row.count;

			const genderName = row.gender ?? 'Unknown';
			const existingGender = school.gender.find((g) => g.name === genderName);
			if (existingGender) {
				existingGender.value += row.count;
			} else {
				school.gender.push({
					name: genderName,
					value: row.count,
					color: genderColorMap[genderName] ?? 'gray.6',
				});
			}

			const natName = row.nationality ?? 'Unknown';
			const existingNat = school.nationality.find((n) => n.name === natName);
			if (existingNat) {
				existingNat.value += row.count;
			} else {
				school.nationality.push({ name: natName, value: row.count });
			}
		}

		return Array.from(schoolMap.values()).sort((a, b) =>
			a.schoolName.localeCompare(b.schoolName)
		);
	}
}
