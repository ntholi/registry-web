import { and, count, desc, eq, sql } from 'drizzle-orm';
import { auditLogs, db, users } from '@/core/database';

interface StudentHistoryEntry {
	id: bigint;
	tableName: string;
	recordId: string;
	operation: string;
	oldValues: Record<string, unknown> | null;
	newValues: Record<string, unknown> | null;
	changedAt: Date;
	activityType: string | null;
	changedByRole: string | null;
	changedByName: string | null;
	changedByImage: string | null;
	metadata: Record<string, unknown> | null;
}

interface RoleSummary {
	role: string;
	count: number;
}

interface TableSummary {
	tableName: string;
	count: number;
}

export type { StudentHistoryEntry, RoleSummary, TableSummary };

class StudentHistoryRepository {
	async getStudentHistory(params: {
		stdNo: number;
		role?: string;
		page: number;
		pageSize?: number;
		tableFilter?: string;
	}): Promise<{
		items: StudentHistoryEntry[];
		totalPages: number;
		totalItems: number;
	}> {
		const { stdNo, role, page, pageSize = 20, tableFilter } = params;

		const conditions = [eq(auditLogs.stdNo, stdNo)];
		if (role) conditions.push(eq(auditLogs.changedByRole, role));
		if (tableFilter) conditions.push(eq(auditLogs.tableName, tableFilter));

		const where = and(...conditions);

		const [totalResult, items] = await Promise.all([
			db.select({ count: count() }).from(auditLogs).where(where),
			db
				.select({
					id: auditLogs.id,
					tableName: auditLogs.tableName,
					recordId: auditLogs.recordId,
					operation: auditLogs.operation,
					oldValues: auditLogs.oldValues,
					newValues: auditLogs.newValues,
					changedAt: auditLogs.changedAt,
					activityType: auditLogs.activityType,
					changedByRole: auditLogs.changedByRole,
					metadata: auditLogs.metadata,
					changedByName: users.name,
					changedByImage: users.image,
				})
				.from(auditLogs)
				.leftJoin(users, eq(auditLogs.changedBy, users.id))
				.where(where)
				.orderBy(desc(auditLogs.changedAt))
				.limit(pageSize)
				.offset((page - 1) * pageSize),
		]);

		const totalItems = totalResult[0]?.count ?? 0;

		return {
			items: items.map((row) => ({
				id: row.id,
				tableName: row.tableName,
				recordId: row.recordId,
				operation: row.operation,
				oldValues: row.oldValues as Record<string, unknown> | null,
				newValues: row.newValues as Record<string, unknown> | null,
				changedAt: row.changedAt,
				activityType: row.activityType,
				changedByRole: row.changedByRole,
				changedByName: row.changedByName,
				changedByImage: row.changedByImage,
				metadata: row.metadata as Record<string, unknown> | null,
			})),
			totalPages: Math.ceil(totalItems / pageSize),
			totalItems,
		};
	}

	async getStudentHistorySummary(stdNo: number): Promise<RoleSummary[]> {
		const results = await db
			.select({
				role: auditLogs.changedByRole,
				count: count(),
			})
			.from(auditLogs)
			.where(
				and(
					eq(auditLogs.stdNo, stdNo),
					sql`${auditLogs.changedByRole} IS NOT NULL`
				)
			)
			.groupBy(auditLogs.changedByRole)
			.orderBy(desc(count()));

		return results.map((r) => ({
			role: r.role!,
			count: r.count,
		}));
	}

	async getStudentHistoryTableSummary(
		stdNo: number,
		role?: string
	): Promise<TableSummary[]> {
		const conditions = [eq(auditLogs.stdNo, stdNo)];
		if (role) conditions.push(eq(auditLogs.changedByRole, role));

		const results = await db
			.select({
				tableName: auditLogs.tableName,
				count: count(),
			})
			.from(auditLogs)
			.where(and(...conditions))
			.groupBy(auditLogs.tableName)
			.orderBy(desc(count()));

		return results.map((r) => ({
			tableName: r.tableName,
			count: r.count,
		}));
	}
}

export const studentHistoryRepository = new StudentHistoryRepository();
