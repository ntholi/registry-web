import { and, count, desc, eq, sql } from 'drizzle-orm';
import { applications, db, programs, schools } from '@/core/database';
import { buildAdmissionReportConditions } from '../../_shared/reportConditions';
import type { AdmissionReportFilter } from '../../_shared/types';

const hasBankDeposit = sql`EXISTS (
	SELECT 1 FROM bank_deposits bd WHERE bd.application_id = ${applications.id}
)`;

export interface StatusCount {
	draft: number;
	submitted: number;
	submittedPaid: number;
	total: number;
}

export interface SummaryRow {
	schoolName: string;
	schoolId: number;
	programName: string;
	programId: number;
	programLevel: string;
	counts: StatusCount;
}

export interface ChartData {
	statusDistribution: Array<{ name: string; value: number; color: string }>;
	bySchool: Array<{
		school: string;
		draft: number;
		submitted: number;
		submittedPaid: number;
	}>;
}

export class ApplicationSummaryRepository {
	async getSummaryData(filter: AdmissionReportFilter): Promise<SummaryRow[]> {
		const conditions = buildAdmissionReportConditions(filter);
		const totalCount = count();

		const rows = await db
			.select({
				schoolName: schools.code,
				schoolId: schools.id,
				programName: programs.name,
				programId: programs.id,
				programLevel: programs.level,
				draft: count(
					sql`CASE WHEN ${applications.status} = 'draft' THEN 1 END`
				),
				submitted: count(
					sql`CASE WHEN ${applications.status} = 'submitted' THEN 1 END`
				),
				submittedPaid: count(
					sql`CASE WHEN ${applications.status} = 'submitted' AND ${hasBankDeposit} THEN 1 END`
				),
				total: totalCount,
			})
			.from(applications)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(conditions.length ? and(...conditions) : undefined)
			.groupBy(
				schools.id,
				schools.code,
				programs.id,
				programs.name,
				programs.level
			)
			.orderBy(desc(totalCount), schools.code, programs.name);

		return rows.map((r) => ({
			schoolName: r.schoolName,
			schoolId: r.schoolId,
			programName: r.programName,
			programId: r.programId,
			programLevel: r.programLevel,
			counts: {
				draft: r.draft,
				submitted: r.submitted,
				submittedPaid: r.submittedPaid,
				total: r.total,
			},
		}));
	}

	async getChartData(filter: AdmissionReportFilter): Promise<ChartData> {
		const conditions = buildAdmissionReportConditions(filter);
		const whereClause = conditions.length ? and(...conditions) : undefined;

		const statusRows = await db
			.select({
				label: sql<string>`CASE
					WHEN ${applications.status} = 'draft' THEN 'Draft'
					WHEN ${applications.status} = 'submitted' AND ${hasBankDeposit} THEN 'Submitted & Paid'
					WHEN ${applications.status} = 'submitted' THEN 'Submitted'
					ELSE 'Other'
				END`,
				count: count(),
			})
			.from(applications)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(whereClause)
			.groupBy(
				sql`CASE
					WHEN ${applications.status} = 'draft' THEN 'Draft'
					WHEN ${applications.status} = 'submitted' AND ${hasBankDeposit} THEN 'Submitted & Paid'
					WHEN ${applications.status} = 'submitted' THEN 'Submitted'
					ELSE 'Other'
				END`
			);

		const colorMap: Record<string, string> = {
			Draft: 'gray.6',
			Submitted: 'blue.6',
			'Submitted & Paid': 'green.6',
			Other: 'orange.6',
		};

		const statusDistribution = statusRows
			.filter((r) => r.label !== 'Other')
			.map((r) => ({
				name: r.label,
				value: r.count,
				color: colorMap[r.label] ?? 'gray.6',
			}));

		const schoolRows = await db
			.select({
				school: schools.code,
				draft: count(
					sql`CASE WHEN ${applications.status} = 'draft' THEN 1 END`
				),
				submitted: count(
					sql`CASE WHEN ${applications.status} = 'submitted' THEN 1 END`
				),
				submittedPaid: count(
					sql`CASE WHEN ${applications.status} = 'submitted' AND ${hasBankDeposit} THEN 1 END`
				),
			})
			.from(applications)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(whereClause)
			.groupBy(schools.code)
			.orderBy(desc(count()), schools.code);

		return {
			statusDistribution,
			bySchool: schoolRows.map((row) => ({
				school: row.school,
				draft: row.draft,
				submitted: row.submitted,
				submittedPaid: row.submittedPaid,
			})),
		};
	}
}
