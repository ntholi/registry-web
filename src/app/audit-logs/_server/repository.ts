import { users } from '@auth/users/_schema/users';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { auditLogs, db } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import BaseRepository from '@/core/platform/BaseRepository';

const userColumns = {
	id: users.id,
	name: users.name,
	email: users.email,
	image: users.image,
};

export default class AuditLogRepository extends BaseRepository<
	typeof auditLogs,
	'id'
> {
	protected auditEnabled = false;

	constructor() {
		super(auditLogs, auditLogs.id);
	}

	async query(
		options: QueryOptions<typeof auditLogs> & {
			tableName?: string;
			operation?: string;
		}
	) {
		const { page = 1, size = 15, search, tableName, operation } = options;
		const offset = (page - 1) * size;

		const conditions = [];

		if (tableName) {
			conditions.push(eq(auditLogs.tableName, tableName));
		}
		if (operation) {
			conditions.push(eq(auditLogs.operation, operation));
		}
		if (search) {
			conditions.push(
				sql`(${auditLogs.tableName}::text ILIKE ${`%${search}%`} OR ${auditLogs.recordId}::text ILIKE ${`%${search}%`})`
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const items = await db
			.select({
				id: auditLogs.id,
				tableName: auditLogs.tableName,
				recordId: auditLogs.recordId,
				operation: auditLogs.operation,
				oldValues: auditLogs.oldValues,
				newValues: auditLogs.newValues,
				changedBy: auditLogs.changedBy,
				changedAt: auditLogs.changedAt,
				syncedAt: auditLogs.syncedAt,
				metadata: auditLogs.metadata,
				activityType: auditLogs.activityType,
				changedByUser: userColumns,
			})
			.from(auditLogs)
			.leftJoin(users, eq(auditLogs.changedBy, users.id))
			.where(where)
			.orderBy(desc(auditLogs.changedAt))
			.limit(size)
			.offset(offset);

		const [{ count }] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(auditLogs)
			.where(where);

		return {
			items,
			totalPages: Math.ceil(count / size),
			totalItems: count,
		};
	}

	async findByRecord(tableName: string, recordId: string) {
		return db
			.select({
				id: auditLogs.id,
				tableName: auditLogs.tableName,
				recordId: auditLogs.recordId,
				operation: auditLogs.operation,
				oldValues: auditLogs.oldValues,
				newValues: auditLogs.newValues,
				changedBy: auditLogs.changedBy,
				changedAt: auditLogs.changedAt,
				metadata: auditLogs.metadata,
				changedByUser: userColumns,
			})
			.from(auditLogs)
			.leftJoin(users, eq(auditLogs.changedBy, users.id))
			.where(
				and(
					eq(auditLogs.tableName, tableName),
					eq(auditLogs.recordId, recordId)
				)
			)
			.orderBy(desc(auditLogs.changedAt));
	}

	async findByUser(userId: string, page: number, size = 15) {
		const offset = (page - 1) * size;
		const where = eq(auditLogs.changedBy, userId);

		const items = await db
			.select({
				id: auditLogs.id,
				tableName: auditLogs.tableName,
				recordId: auditLogs.recordId,
				operation: auditLogs.operation,
				oldValues: auditLogs.oldValues,
				newValues: auditLogs.newValues,
				changedBy: auditLogs.changedBy,
				changedAt: auditLogs.changedAt,
				metadata: auditLogs.metadata,
				changedByUser: userColumns,
			})
			.from(auditLogs)
			.leftJoin(users, eq(auditLogs.changedBy, users.id))
			.where(where)
			.orderBy(desc(auditLogs.changedAt))
			.limit(size)
			.offset(offset);

		const [{ count }] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(auditLogs)
			.where(where);

		return {
			items,
			totalPages: Math.ceil(count / size),
			totalItems: count,
		};
	}

	async findByTable(tableName: string, page: number, size = 15) {
		const offset = (page - 1) * size;
		const where = eq(auditLogs.tableName, tableName);

		const items = await db
			.select({
				id: auditLogs.id,
				tableName: auditLogs.tableName,
				recordId: auditLogs.recordId,
				operation: auditLogs.operation,
				oldValues: auditLogs.oldValues,
				newValues: auditLogs.newValues,
				changedBy: auditLogs.changedBy,
				changedAt: auditLogs.changedAt,
				metadata: auditLogs.metadata,
				changedByUser: userColumns,
			})
			.from(auditLogs)
			.leftJoin(users, eq(auditLogs.changedBy, users.id))
			.where(where)
			.orderBy(desc(auditLogs.changedAt))
			.limit(size)
			.offset(offset);

		const [{ count }] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(auditLogs)
			.where(where);

		return {
			items,
			totalPages: Math.ceil(count / size),
			totalItems: count,
		};
	}

	async findDistinctTables(): Promise<string[]> {
		const rows = await db
			.selectDistinct({ tableName: auditLogs.tableName })
			.from(auditLogs)
			.orderBy(auditLogs.tableName);
		return rows.map((r) => r.tableName);
	}

	async findUnsynced() {
		return db
			.select({
				id: auditLogs.id,
				tableName: auditLogs.tableName,
				recordId: auditLogs.recordId,
				operation: auditLogs.operation,
				oldValues: auditLogs.oldValues,
				newValues: auditLogs.newValues,
				changedBy: auditLogs.changedBy,
				changedAt: auditLogs.changedAt,
				metadata: auditLogs.metadata,
			})
			.from(auditLogs)
			.where(isNull(auditLogs.syncedAt))
			.orderBy(auditLogs.changedAt);
	}

	async markAsSynced(id: bigint) {
		const [updated] = await db
			.update(auditLogs)
			.set({ syncedAt: new Date() })
			.where(eq(auditLogs.id, id))
			.returning();
		return updated;
	}

	async findByStudentModule(studentModuleId: number) {
		const recordIds = db
			.select({ id: sql<string>`id::text` })
			.from(sql`assessment_marks`)
			.where(sql`student_module_id = ${studentModuleId}`);

		return db
			.select({
				id: auditLogs.id,
				tableName: auditLogs.tableName,
				recordId: auditLogs.recordId,
				operation: auditLogs.operation,
				oldValues: auditLogs.oldValues,
				newValues: auditLogs.newValues,
				changedBy: auditLogs.changedBy,
				changedAt: auditLogs.changedAt,
				metadata: auditLogs.metadata,
				changedByUser: userColumns,
			})
			.from(auditLogs)
			.leftJoin(users, eq(auditLogs.changedBy, users.id))
			.where(
				and(
					eq(auditLogs.tableName, 'assessment_marks'),
					inArray(auditLogs.recordId, recordIds)
				)
			)
			.orderBy(desc(auditLogs.changedAt));
	}

	async getById(id: bigint) {
		const [result] = await db
			.select({
				id: auditLogs.id,
				tableName: auditLogs.tableName,
				recordId: auditLogs.recordId,
				operation: auditLogs.operation,
				oldValues: auditLogs.oldValues,
				newValues: auditLogs.newValues,
				changedBy: auditLogs.changedBy,
				changedAt: auditLogs.changedAt,
				syncedAt: auditLogs.syncedAt,
				metadata: auditLogs.metadata,
				changedByUser: userColumns,
			})
			.from(auditLogs)
			.leftJoin(users, eq(auditLogs.changedBy, users.id))
			.where(eq(auditLogs.id, id));
		return result ?? null;
	}
}
