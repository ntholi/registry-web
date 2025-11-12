import { and, between, count, eq, isNotNull, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm/sql';
import { db } from '@/db';
import { clearance, type DashboardUser } from '@/db/schema';

type DateInput = Date | string | number;

export type ClearanceType = 'registration' | 'graduation' | 'all';

export interface DateRangeFilter {
	startDate?: DateInput;
	endDate?: DateInput;
}

export interface ClearanceFilter extends DateRangeFilter {
	type?: ClearanceType;
}

function normalizeDate(input?: DateInput): Date | undefined {
	if (!input) return undefined;
	if (input instanceof Date) return input;
	const parsed = new Date(input);
	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function getClearanceStatsByDepartment(
	department: DashboardUser,
	filter?: ClearanceFilter
) {
	let dateCondition: SQL | undefined;
	const type = filter?.type || 'all';

	const start = normalizeDate(filter?.startDate);
	const end = normalizeDate(filter?.endDate);

	if (start && end) {
		dateCondition = between(clearance.responseDate, start, end);
	}

	// Build the base query conditions
	const baseConditions = [eq(clearance.department, department)];
	if (dateCondition) {
		baseConditions.push(dateCondition);
	}

	// Add clearance type filter
	let typeCondition: SQL | undefined;
	if (type === 'registration') {
		typeCondition = sql`EXISTS (SELECT 1 FROM registration_clearance rc WHERE rc.clearance_id = clearance.id)`;
	} else if (type === 'graduation') {
		typeCondition = sql`EXISTS (SELECT 1 FROM graduation_clearance gc WHERE gc.clearance_id = clearance.id)`;
	}

	if (typeCondition) {
		baseConditions.push(typeCondition);
	}

	const overallStats = await db
		.select({
			total: count(clearance.id),
			approved:
				sql`SUM(CASE WHEN ${clearance.status} = 'approved' THEN 1 ELSE 0 END)`.mapWith(
					Number
				),
			rejected:
				sql`SUM(CASE WHEN ${clearance.status} = 'rejected' THEN 1 ELSE 0 END)`.mapWith(
					Number
				),
			pending:
				sql`SUM(CASE WHEN ${clearance.status} = 'pending' THEN 1 ELSE 0 END)`.mapWith(
					Number
				),
		})
		.from(clearance)
		.where(and(...baseConditions));

	// For staff stats, add additional condition for responded by
	const staffConditions = [...baseConditions, isNotNull(clearance.respondedBy)];

	const staffStats = await db
		.select({
			respondedBy: clearance.respondedBy,
			approved:
				sql`SUM(CASE WHEN ${clearance.status} = 'approved' THEN 1 ELSE 0 END)`.mapWith(
					Number
				),
			rejected:
				sql`SUM(CASE WHEN ${clearance.status} = 'rejected' THEN 1 ELSE 0 END)`.mapWith(
					Number
				),
			total: count(clearance.id),
		})
		.from(clearance)
		.where(and(...staffConditions))
		.groupBy(clearance.respondedBy);

	return {
		overall: overallStats[0],
		staff: staffStats,
	};
}

export async function getUserNamesByIds(userIds: string[]) {
	if (userIds.length === 0) return [];

	return await db.query.users.findMany({
		where: (users, { inArray }) => inArray(users.id, userIds),
		columns: {
			id: true,
			name: true,
		},
	});
}
