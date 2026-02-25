import { and, count, desc, eq, sql } from 'drizzle-orm';
import {
	academicRecords,
	applicants,
	applications,
	db,
	programs,
	schools,
} from '@/core/database';
import { buildAdmissionReportConditions } from '../../_shared/reportConditions';
import type { AdmissionReportFilter } from '../../_shared/types';

export const AGE_GROUPS = [
	{ min: 12, max: 15, label: '12+' },
	{ min: 16, max: 17, label: '16-17' },
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

export interface OriginSchoolRow {
	name: string;
	count: number;
}

export class DemographicsRepository {
	async getOverview(
		filter: AdmissionReportFilter
	): Promise<DemographicsOverview> {
		const conditions = buildAdmissionReportConditions(filter);
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

	async getTopOriginSchools(
		filter: AdmissionReportFilter
	): Promise<OriginSchoolRow[]> {
		const conditions = buildAdmissionReportConditions(filter);
		const whereClause = conditions.length ? and(...conditions) : undefined;

		const rows = await db
			.select({
				name: academicRecords.institutionName,
				count: count(),
			})
			.from(academicRecords)
			.innerJoin(
				applications,
				eq(academicRecords.applicantId, applications.applicantId)
			)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(whereClause)
			.groupBy(academicRecords.institutionName)
			.orderBy(desc(count()))
			.limit(50);

		return rows;
	}
}
