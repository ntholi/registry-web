import { and, between, count, eq, ilike, or, sql } from 'drizzle-orm';
import {
	auditLogs,
	clearance,
	db,
	statementOfResultsPrints,
	studentCardPrints,
	transcriptPrints,
	users,
} from '@/core/database';
import type {
	ClearanceEmployeeStats,
	DailyTrend,
	DateRange,
	DepartmentSummary,
	EmployeeActivity,
	EmployeeSummary,
	EntityBreakdown,
	HeatmapData,
	PrintEmployeeStats,
} from '../_lib/types';

const PAGE_SIZE = 20;

class ActivityTrackerRepository {
	async getDepartmentSummary(
		dept: string,
		dateRange: DateRange
	): Promise<DepartmentSummary> {
		const deptFilter =
			dept === 'all'
				? undefined
				: eq(users.role, dept as (typeof users.role.enumValues)[number]);

		const [stats] = await db
			.select({
				totalOperations: count(auditLogs.id),
				activeEmployees: sql<number>`COUNT(DISTINCT ${auditLogs.changedBy})::int`,
				inserts: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'INSERT')::int`,
				updates: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'UPDATE')::int`,
				deletes: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'DELETE')::int`,
			})
			.from(auditLogs)
			.innerJoin(users, eq(users.id, auditLogs.changedBy))
			.where(
				and(
					deptFilter,
					between(auditLogs.changedAt, dateRange.start, dateRange.end)
				)
			);

		const [empCount] = await db
			.select({ total: count(users.id) })
			.from(users)
			.where(deptFilter ? and(deptFilter) : undefined);

		const topTables = await db
			.select({
				tableName: auditLogs.tableName,
				count: sql<number>`COUNT(*)::int`,
			})
			.from(auditLogs)
			.innerJoin(users, eq(users.id, auditLogs.changedBy))
			.where(
				and(
					deptFilter,
					between(auditLogs.changedAt, dateRange.start, dateRange.end)
				)
			)
			.groupBy(auditLogs.tableName)
			.orderBy(sql`COUNT(*) DESC`)
			.limit(5);

		return {
			totalOperations: stats?.totalOperations ?? 0,
			totalEmployees: empCount?.total ?? 0,
			activeEmployees: stats?.activeEmployees ?? 0,
			operationsByType: {
				inserts: stats?.inserts ?? 0,
				updates: stats?.updates ?? 0,
				deletes: stats?.deletes ?? 0,
			},
			topTables,
		};
	}

	async getEmployeeList(
		dept: string,
		dateRange: DateRange,
		page: number,
		search: string
	): Promise<{
		items: EmployeeSummary[];
		totalPages: number;
		totalItems: number;
	}> {
		const offset = (page - 1) * PAGE_SIZE;
		const deptFilter =
			dept === 'all'
				? undefined
				: eq(users.role, dept as (typeof users.role.enumValues)[number]);
		const searchFilter = search
			? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
			: undefined;

		const baseWhere = and(deptFilter, searchFilter);

		const items = await db
			.select({
				userId: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				totalOperations: sql<number>`COUNT(${auditLogs.id})::int`,
				lastActiveAt: sql<Date | null>`MAX(${auditLogs.changedAt})`,
				inserts: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'INSERT')::int`,
				updates: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'UPDATE')::int`,
				deletes: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'DELETE')::int`,
			})
			.from(users)
			.leftJoin(
				auditLogs,
				and(
					eq(auditLogs.changedBy, users.id),
					between(auditLogs.changedAt, dateRange.start, dateRange.end)
				)
			)
			.where(baseWhere)
			.groupBy(users.id)
			.orderBy(sql`COUNT(${auditLogs.id}) DESC`)
			.limit(PAGE_SIZE)
			.offset(offset);

		const [totalResult] = await db
			.select({ total: count(users.id) })
			.from(users)
			.where(baseWhere);
		const totalItems = totalResult?.total ?? 0;

		return {
			items,
			totalPages: Math.ceil(totalItems / PAGE_SIZE),
			totalItems,
		};
	}

	async getEmployeeActivity(
		userId: string,
		dateRange: DateRange
	): Promise<EmployeeActivity> {
		const dateFilter = and(
			eq(auditLogs.changedBy, userId),
			between(auditLogs.changedAt, dateRange.start, dateRange.end)
		);

		const [userResult, statsResult, topTablesResult, dailyResult] =
			await Promise.all([
				db
					.select({
						id: users.id,
						name: users.name,
						email: users.email,
						image: users.image,
					})
					.from(users)
					.where(eq(users.id, userId))
					.then((r) => r[0]),

				db
					.select({
						totalOperations: count(auditLogs.id),
						inserts: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'INSERT')::int`,
						updates: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'UPDATE')::int`,
						deletes: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'DELETE')::int`,
					})
					.from(auditLogs)
					.where(dateFilter),

				db
					.select({
						tableName: auditLogs.tableName,
						count: sql<number>`COUNT(*)::int`,
					})
					.from(auditLogs)
					.where(dateFilter)
					.groupBy(auditLogs.tableName)
					.orderBy(sql`COUNT(*) DESC`)
					.limit(5),

				db
					.select({
						date: sql<string>`DATE(${auditLogs.changedAt})::text`,
						count: sql<number>`COUNT(*)::int`,
					})
					.from(auditLogs)
					.where(dateFilter)
					.groupBy(sql`DATE(${auditLogs.changedAt})`)
					.orderBy(sql`DATE(${auditLogs.changedAt})`),
			]);

		const stats = statsResult[0];

		return {
			user: userResult ?? { id: userId, name: null, email: null, image: null },
			totalOperations: stats?.totalOperations ?? 0,
			operationsByType: {
				inserts: stats?.inserts ?? 0,
				updates: stats?.updates ?? 0,
				deletes: stats?.deletes ?? 0,
			},
			topTables: topTablesResult,
			dailyActivity: dailyResult,
		};
	}

	async getEmployeeTimeline(
		userId: string,
		dateRange: DateRange,
		page: number
	) {
		const offset = (page - 1) * PAGE_SIZE;
		const dateFilter = and(
			eq(auditLogs.changedBy, userId),
			between(auditLogs.changedAt, dateRange.start, dateRange.end)
		);

		const [items, [totalResult]] = await Promise.all([
			db
				.select({
					id: auditLogs.id,
					tableName: auditLogs.tableName,
					recordId: auditLogs.recordId,
					operation: auditLogs.operation,
					oldValues: auditLogs.oldValues,
					newValues: auditLogs.newValues,
					changedAt: auditLogs.changedAt,
					metadata: auditLogs.metadata,
				})
				.from(auditLogs)
				.where(dateFilter)
				.orderBy(sql`${auditLogs.changedAt} DESC`)
				.limit(PAGE_SIZE)
				.offset(offset),

			db
				.select({ total: count(auditLogs.id) })
				.from(auditLogs)
				.where(dateFilter),
		]);

		const totalItems = totalResult?.total ?? 0;

		return {
			items,
			totalPages: Math.ceil(totalItems / PAGE_SIZE),
			totalItems,
		};
	}

	async getActivityHeatmap(
		userId: string,
		dateRange: DateRange
	): Promise<HeatmapData> {
		return db
			.select({
				dayOfWeek: sql<number>`EXTRACT(DOW FROM ${auditLogs.changedAt})::int`,
				hour: sql<number>`EXTRACT(HOUR FROM ${auditLogs.changedAt})::int`,
				count: sql<number>`COUNT(*)::int`,
			})
			.from(auditLogs)
			.where(
				and(
					eq(auditLogs.changedBy, userId),
					between(auditLogs.changedAt, dateRange.start, dateRange.end)
				)
			)
			.groupBy(
				sql`EXTRACT(DOW FROM ${auditLogs.changedAt})`,
				sql`EXTRACT(HOUR FROM ${auditLogs.changedAt})`
			)
			.orderBy(
				sql`EXTRACT(DOW FROM ${auditLogs.changedAt})`,
				sql`EXTRACT(HOUR FROM ${auditLogs.changedAt})`
			);
	}

	async getDailyTrends(
		dept: string,
		dateRange: DateRange
	): Promise<DailyTrend[]> {
		const deptFilter =
			dept === 'all'
				? undefined
				: eq(users.role, dept as (typeof users.role.enumValues)[number]);

		return db
			.select({
				date: sql<string>`DATE(${auditLogs.changedAt})::text`,
				total: sql<number>`COUNT(*)::int`,
				inserts: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'INSERT')::int`,
				updates: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'UPDATE')::int`,
				deletes: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'DELETE')::int`,
			})
			.from(auditLogs)
			.innerJoin(users, eq(users.id, auditLogs.changedBy))
			.where(
				and(
					deptFilter,
					between(auditLogs.changedAt, dateRange.start, dateRange.end)
				)
			)
			.groupBy(sql`DATE(${auditLogs.changedAt})`)
			.orderBy(sql`DATE(${auditLogs.changedAt})`);
	}

	async getEntityBreakdown(
		userId: string,
		dateRange: DateRange
	): Promise<EntityBreakdown[]> {
		return db
			.select({
				tableName: auditLogs.tableName,
				total: sql<number>`COUNT(*)::int`,
				inserts: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'INSERT')::int`,
				updates: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'UPDATE')::int`,
				deletes: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.operation} = 'DELETE')::int`,
			})
			.from(auditLogs)
			.where(
				and(
					eq(auditLogs.changedBy, userId),
					between(auditLogs.changedAt, dateRange.start, dateRange.end)
				)
			)
			.groupBy(auditLogs.tableName)
			.orderBy(sql`COUNT(*) DESC`);
	}

	async isUserInDepartment(userId: string, dept: string): Promise<boolean> {
		const [result] = await db
			.select({ id: users.id })
			.from(users)
			.where(
				and(
					eq(users.id, userId),
					eq(users.role, dept as (typeof users.role.enumValues)[number])
				)
			)
			.limit(1);
		return !!result;
	}

	async getClearanceStats(
		dept: string,
		dateRange: DateRange
	): Promise<ClearanceEmployeeStats[]> {
		const deptFilter =
			dept === 'all'
				? undefined
				: eq(users.role, dept as (typeof users.role.enumValues)[number]);

		return db
			.select({
				userId: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				approved: sql<number>`COUNT(*) FILTER (WHERE ${clearance.status} = 'approved')::int`,
				rejected: sql<number>`COUNT(*) FILTER (WHERE ${clearance.status} = 'rejected')::int`,
				pending: sql<number>`COUNT(*) FILTER (WHERE ${clearance.status} = 'pending')::int`,
				total: sql<number>`COUNT(${clearance.id})::int`,
				approvalRate: sql<number>`CASE
					WHEN COUNT(${clearance.id}) > 0
					THEN ROUND(COUNT(*) FILTER (WHERE ${clearance.status} = 'approved') * 100.0 / COUNT(${clearance.id}))::int
					ELSE 0
				END`,
			})
			.from(users)
			.leftJoin(
				clearance,
				and(
					eq(clearance.respondedBy, users.id),
					dept === 'all'
						? undefined
						: eq(
								clearance.department,
								dept as (typeof clearance.department.enumValues)[number]
							),
					between(clearance.responseDate, dateRange.start, dateRange.end)
				)
			)
			.where(deptFilter)
			.groupBy(users.id)
			.orderBy(sql`COUNT(${clearance.id}) DESC`);
	}

	async getPrintStats(
		dept: string,
		dateRange: DateRange
	): Promise<PrintEmployeeStats[]> {
		const result = await db.execute<{
			user_id: string;
			transcripts: number;
			statements: number;
			student_cards: number;
			total_prints: number;
		}>(sql`
			SELECT
				u.id AS user_id,
				COALESCE(p.transcripts, 0) AS transcripts,
				COALESCE(p.statements, 0) AS statements,
				COALESCE(p.student_cards, 0) AS student_cards,
				COALESCE(p.transcripts, 0) + COALESCE(p.statements, 0) + COALESCE(p.student_cards, 0) AS total_prints
			FROM ${users} u
			LEFT JOIN (
				SELECT
					printed_by,
					SUM(CASE WHEN source = 'transcript' THEN cnt ELSE 0 END)::int AS transcripts,
					SUM(CASE WHEN source = 'statement' THEN cnt ELSE 0 END)::int AS statements,
					SUM(CASE WHEN source = 'student_card' THEN cnt ELSE 0 END)::int AS student_cards
				FROM (
					SELECT printed_by, 'transcript' AS source, COUNT(*)::int AS cnt
					FROM ${transcriptPrints}
					WHERE ${transcriptPrints.printedAt} BETWEEN ${dateRange.start} AND ${dateRange.end}
					GROUP BY printed_by
					UNION ALL
					SELECT printed_by, 'statement' AS source, COUNT(*)::int AS cnt
					FROM ${statementOfResultsPrints}
					WHERE ${statementOfResultsPrints.printedAt} BETWEEN ${dateRange.start} AND ${dateRange.end}
					GROUP BY printed_by
					UNION ALL
					SELECT printed_by, 'student_card' AS source, COUNT(*)::int AS cnt
					FROM ${studentCardPrints}
					WHERE ${studentCardPrints.createdAt} BETWEEN ${dateRange.start} AND ${dateRange.end}
					GROUP BY printed_by
				) all_prints
				GROUP BY printed_by
			) p ON p.printed_by = u.id
			WHERE ${dept === 'all' ? sql`TRUE` : sql`u.role = ${dept}`}
				AND p.printed_by IS NOT NULL
			ORDER BY total_prints DESC
		`);

		return result.rows.map((r) => ({
			userId: r.user_id,
			transcripts: Number(r.transcripts),
			statements: Number(r.statements),
			studentCards: Number(r.student_cards),
			totalPrints: Number(r.total_prints),
		}));
	}
}

export default ActivityTrackerRepository;
