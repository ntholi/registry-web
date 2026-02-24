import { and, between, count, eq, ilike, isNotNull, sql } from 'drizzle-orm';
import { auditLogs, db, users } from '@/core/database';
import { getActivityLabel } from '../_lib/activity-catalog';
import type {
	ActivitySummary,
	DailyTrend,
	EmployeeActivityBreakdown,
	EmployeeSummary,
	HeatmapCell,
	TimelineEntry,
} from '../_lib/types';

const PAGE_SIZE = 10;

class ActivityTrackerRepository {
	async getDepartmentSummary(
		start: Date,
		end: Date,
		dept?: string
	): Promise<ActivitySummary[]> {
		const deptFilter = dept
			? eq(users.role, dept as (typeof users.role.enumValues)[number])
			: undefined;

		const rows = await db
			.select({
				activityType: auditLogs.activityType,
				count: sql<number>`COUNT(*)::int`,
			})
			.from(auditLogs)
			.innerJoin(users, eq(users.id, auditLogs.changedBy))
			.where(
				and(
					isNotNull(auditLogs.activityType),
					between(auditLogs.changedAt, start, end),
					deptFilter
				)
			)
			.groupBy(auditLogs.activityType)
			.orderBy(sql`COUNT(*) DESC`);

		return rows.map((r) => ({
			activityType: r.activityType!,
			label: getActivityLabel(r.activityType!),
			count: r.count,
		}));
	}

	async getEmployeeList(
		start: Date,
		end: Date,
		page: number,
		search: string,
		dept?: string
	): Promise<{
		items: EmployeeSummary[];
		totalPages: number;
		totalItems: number;
	}> {
		const offset = (page - 1) * PAGE_SIZE;
		const deptFilter = dept
			? eq(users.role, dept as (typeof users.role.enumValues)[number])
			: undefined;
		const searchFilter = search ? ilike(users.name, `%${search}%`) : undefined;

		const activityCounts = db.$with('activity_counts').as(
			db
				.select({
					userId: auditLogs.changedBy,
					activityType: auditLogs.activityType,
					cnt: sql<number>`COUNT(*)::int`.as('cnt'),
				})
				.from(auditLogs)
				.where(
					and(
						isNotNull(auditLogs.activityType),
						isNotNull(auditLogs.changedBy),
						between(auditLogs.changedAt, start, end)
					)
				)
				.groupBy(auditLogs.changedBy, auditLogs.activityType)
		);

		const ranked = db.$with('ranked').as(
			db
				.with(activityCounts)
				.select({
					userId: activityCounts.userId,
					activityType: activityCounts.activityType,
					cnt: activityCounts.cnt,
					rn: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${activityCounts.userId} ORDER BY ${activityCounts.cnt} DESC)`.as(
						'rn'
					),
				})
				.from(activityCounts)
		);

		const userTotals = db.$with('user_totals').as(
			db
				.with(ranked)
				.select({
					userId: ranked.userId,
					totalActivities: sql<number>`SUM(${ranked.cnt})::int`.as(
						'total_activities'
					),
					topActivity:
						sql<string>`MAX(CASE WHEN ${ranked.rn} = 1 THEN ${ranked.activityType} END)`.as(
							'top_activity'
						),
				})
				.from(ranked)
				.groupBy(ranked.userId)
		);

		const items = await db
			.with(activityCounts, ranked, userTotals)
			.select({
				userId: users.id,
				name: users.name,
				image: users.image,
				totalActivities: sql<number>`COALESCE(${userTotals.totalActivities}, 0)`,
				topActivity: sql<string>`COALESCE(${userTotals.topActivity}, '')`,
			})
			.from(users)
			.leftJoin(userTotals, eq(userTotals.userId, users.id))
			.where(and(deptFilter, searchFilter))
			.orderBy(sql`COALESCE(${userTotals.totalActivities}, 0) DESC`)
			.limit(PAGE_SIZE)
			.offset(offset);

		const [totalResult] = await db
			.select({ total: count(users.id) })
			.from(users)
			.where(and(deptFilter, searchFilter));
		const totalItems = totalResult?.total ?? 0;

		return {
			items: items.map((it) => ({
				userId: it.userId,
				name: it.name,
				image: it.image,
				totalActivities: it.totalActivities,
				topActivity: it.topActivity,
			})),
			totalPages: Math.ceil(totalItems / PAGE_SIZE),
			totalItems,
		};
	}

	async getEmployeeActivityBreakdown(
		userId: string,
		start: Date,
		end: Date
	): Promise<EmployeeActivityBreakdown[]> {
		const rows = await db
			.select({
				activityType: auditLogs.activityType,
				count: sql<number>`COUNT(*)::int`,
			})
			.from(auditLogs)
			.where(
				and(
					eq(auditLogs.changedBy, userId),
					between(auditLogs.changedAt, start, end),
					isNotNull(auditLogs.activityType)
				)
			)
			.groupBy(auditLogs.activityType)
			.orderBy(sql`COUNT(*) DESC`);

		return rows.map((r) => ({
			activityType: r.activityType!,
			label: getActivityLabel(r.activityType!),
			count: r.count,
		}));
	}

	async getEmployeeTimeline(
		userId: string,
		start: Date,
		end: Date,
		page: number
	): Promise<{
		items: TimelineEntry[];
		totalPages: number;
		totalItems: number;
	}> {
		const offset = (page - 1) * PAGE_SIZE;
		const dateFilter = and(
			eq(auditLogs.changedBy, userId),
			between(auditLogs.changedAt, start, end),
			isNotNull(auditLogs.activityType)
		);

		const [rows, [totalResult]] = await Promise.all([
			db
				.select({
					id: auditLogs.id,
					activityType: auditLogs.activityType,
					tableName: auditLogs.tableName,
					recordId: auditLogs.recordId,
					changedAt: auditLogs.changedAt,
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
			items: rows.map((r) => ({
				id: r.id,
				activityType: r.activityType!,
				label: getActivityLabel(r.activityType!),
				timestamp: r.changedAt,
				tableName: r.tableName,
				recordId: r.recordId,
			})),
			totalPages: Math.ceil(totalItems / PAGE_SIZE),
			totalItems,
		};
	}

	async getActivityHeatmap(
		userId: string,
		start: Date,
		end: Date
	): Promise<HeatmapCell[]> {
		return db
			.select({
				date: sql<string>`DATE(${auditLogs.changedAt})::text`,
				count: sql<number>`COUNT(*)::int`,
			})
			.from(auditLogs)
			.where(
				and(
					eq(auditLogs.changedBy, userId),
					between(auditLogs.changedAt, start, end),
					isNotNull(auditLogs.activityType)
				)
			)
			.groupBy(sql`DATE(${auditLogs.changedAt})`)
			.orderBy(sql`DATE(${auditLogs.changedAt})`);
	}

	async getDailyTrends(
		start: Date,
		end: Date,
		dept?: string
	): Promise<DailyTrend[]> {
		const deptFilter = dept
			? eq(users.role, dept as (typeof users.role.enumValues)[number])
			: undefined;

		return db
			.select({
				date: sql<string>`DATE(${auditLogs.changedAt})::text`,
				activityType: sql<string>`COALESCE(${auditLogs.activityType}, 'unknown')`,
				count: sql<number>`COUNT(*)::int`,
			})
			.from(auditLogs)
			.innerJoin(users, eq(users.id, auditLogs.changedBy))
			.where(
				and(
					isNotNull(auditLogs.activityType),
					between(auditLogs.changedAt, start, end),
					deptFilter
				)
			)
			.groupBy(sql`DATE(${auditLogs.changedAt})`, auditLogs.activityType)
			.orderBy(sql`DATE(${auditLogs.changedAt})`);
	}

	async getEmployeeUser(userId: string) {
		const [user] = await db
			.select({
				id: users.id,
				name: users.name,
				image: users.image,
				role: users.role,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);
		return user ?? null;
	}

	async getEmployeeTotalActivities(
		userId: string,
		start: Date,
		end: Date
	): Promise<number> {
		const [result] = await db
			.select({ total: count(auditLogs.id) })
			.from(auditLogs)
			.where(
				and(
					eq(auditLogs.changedBy, userId),
					between(auditLogs.changedAt, start, end),
					isNotNull(auditLogs.activityType)
				)
			);
		return result?.total ?? 0;
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
}

export default ActivityTrackerRepository;
