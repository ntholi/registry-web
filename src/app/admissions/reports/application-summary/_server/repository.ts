import { and, count, desc, eq, inArray, type SQL, sql } from 'drizzle-orm';
import { applications, db, programs, schools } from '@/core/database';
import type { AdmissionReportFilter } from '../../_shared/types';

export interface StatusCount {
	draft: number;
	submitted: number;
	under_review: number;
	accepted_first_choice: number;
	accepted_second_choice: number;
	rejected: number;
	waitlisted: number;
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
		under_review: number;
		accepted_first_choice: number;
		accepted_second_choice: number;
		rejected: number;
		waitlisted: number;
	}>;
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

export class ApplicationSummaryRepository {
	async getSummaryData(filter: AdmissionReportFilter): Promise<SummaryRow[]> {
		const conditions = buildConditions(filter);
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
				underReview: count(
					sql`CASE WHEN ${applications.status} = 'under_review' THEN 1 END`
				),
				acceptedFirst: count(
					sql`CASE WHEN ${applications.status} = 'accepted_first_choice' THEN 1 END`
				),
				acceptedSecond: count(
					sql`CASE WHEN ${applications.status} = 'accepted_second_choice' THEN 1 END`
				),
				rejected: count(
					sql`CASE WHEN ${applications.status} = 'rejected' THEN 1 END`
				),
				waitlisted: count(
					sql`CASE WHEN ${applications.status} = 'waitlisted' THEN 1 END`
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
				under_review: r.underReview,
				accepted_first_choice: r.acceptedFirst,
				accepted_second_choice: r.acceptedSecond,
				rejected: r.rejected,
				waitlisted: r.waitlisted,
				total: r.total,
			},
		}));
	}

	async getChartData(filter: AdmissionReportFilter): Promise<ChartData> {
		const conditions = buildConditions(filter);
		const whereClause = conditions.length ? and(...conditions) : undefined;

		const statusRows = await db
			.select({
				status: applications.status,
				count: count(),
			})
			.from(applications)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(whereClause)
			.groupBy(applications.status);

		const statusColorMap: Record<string, string> = {
			draft: 'gray.6',
			submitted: 'blue.6',
			under_review: 'yellow.6',
			accepted_first_choice: 'green.6',
			accepted_second_choice: 'teal.6',
			rejected: 'red.6',
			waitlisted: 'orange.6',
		};

		const statusDistribution = statusRows.map((r) => ({
			name: r.status
				.replace(/_/g, ' ')
				.replace(/\b\w/g, (c) => c.toUpperCase()),
			value: r.count,
			color: statusColorMap[r.status] ?? 'gray.6',
		}));

		const schoolRows = await db
			.select({
				school: schools.code,
				total: count(),
				draft: count(
					sql`CASE WHEN ${applications.status} = 'draft' THEN 1 END`
				),
				submitted: count(
					sql`CASE WHEN ${applications.status} = 'submitted' THEN 1 END`
				),
				under_review: count(
					sql`CASE WHEN ${applications.status} = 'under_review' THEN 1 END`
				),
				accepted_first_choice: count(
					sql`CASE WHEN ${applications.status} = 'accepted_first_choice' THEN 1 END`
				),
				accepted_second_choice: count(
					sql`CASE WHEN ${applications.status} = 'accepted_second_choice' THEN 1 END`
				),
				rejected: count(
					sql`CASE WHEN ${applications.status} = 'rejected' THEN 1 END`
				),
				waitlisted: count(
					sql`CASE WHEN ${applications.status} = 'waitlisted' THEN 1 END`
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
				under_review: row.under_review,
				accepted_first_choice: row.accepted_first_choice,
				accepted_second_choice: row.accepted_second_choice,
				rejected: row.rejected,
				waitlisted: row.waitlisted,
			})),
		};
	}
}
