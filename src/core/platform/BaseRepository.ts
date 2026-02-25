import { count, eq, or, type SQL, sql } from 'drizzle-orm';
import type { PgColumn as Column, PgTable as Table } from 'drizzle-orm/pg-core';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { resolveTableActivity } from '@/app/admin/activity-tracker/_lib/registry';
import { db } from '@/core/database';
import { auditLogs } from '@/core/database/schema/auditLogs';

type ModelInsert<T extends Table> = T['$inferInsert'];
type ModelSelect<T extends Table> = T['$inferSelect'];

export type TransactionClient = Parameters<
	Parameters<typeof db.transaction>[0]
>[0];

export interface AuditOptions {
	userId: string;
	metadata?: Record<string, unknown>;
	activityType?: string;
	stdNo?: number;
	role?: string;
}

const DEFAULT_PAGE_SIZE = 15;

export interface SortOptions<T extends Table> {
	column: keyof ModelSelect<T>;
	order?: 'asc' | 'desc';
}

export interface QueryOptions<T extends Table> {
	page?: number;
	size?: number;
	search?: string;
	searchColumns?: (keyof ModelSelect<T>)[];
	sort?: SortOptions<T>[];
	filter?: SQL;
}

class BaseRepository<
	T extends Table,
	PK extends keyof T & keyof ModelSelect<T>,
> {
	protected table: T;
	protected primaryKey: Column;
	protected auditEnabled = true;

	constructor(table: T, primaryKey: Column) {
		this.table = table;
		this.primaryKey = primaryKey;
	}

	private getTableName(): string {
		return getTableConfig(this.table as unknown as Table).name;
	}

	private shouldAudit(audit?: AuditOptions): audit is AuditOptions {
		return this.auditEnabled && audit != null;
	}

	private getRecordId(record: ModelSelect<T>): string {
		for (const [key, col] of Object.entries(this.table)) {
			if (col === this.primaryKey) {
				return String((record as Record<string, unknown>)[key]);
			}
		}
		throw new Error(
			`Primary key column not found in table ${this.getTableName()}`
		);
	}

	protected buildAuditMetadata(
		_operation: 'INSERT' | 'UPDATE' | 'DELETE',
		_oldValues: unknown,
		_newValues: unknown
	): Record<string, unknown> {
		return {};
	}

	protected async writeAuditLog(
		tx: TransactionClient,
		operation: 'INSERT' | 'UPDATE' | 'DELETE',
		recordId: string,
		oldValues: unknown,
		newValues: unknown,
		audit: AuditOptions
	): Promise<void> {
		const meta = {
			...this.buildAuditMetadata(operation, oldValues, newValues),
			...audit.metadata,
		};

		const activityType =
			audit.activityType ??
			resolveTableActivity(this.getTableName(), operation) ??
			null;

		await tx.insert(auditLogs).values({
			tableName: this.getTableName(),
			recordId,
			operation,
			oldValues: oldValues ?? null,
			newValues: newValues ?? null,
			changedBy: audit.userId,
			metadata: Object.keys(meta).length > 0 ? meta : null,
			activityType,
			stdNo: audit.stdNo ?? null,
			changedByRole: audit.role ?? null,
		});
	}

	protected async writeAuditLogForTable(
		tx: TransactionClient,
		tableName: string,
		operation: 'INSERT' | 'UPDATE' | 'DELETE',
		recordId: string,
		oldValues: unknown,
		newValues: unknown,
		audit: AuditOptions
	): Promise<void> {
		const meta = {
			...this.buildAuditMetadata(operation, oldValues, newValues),
			...audit.metadata,
		};

		const activityType =
			audit.activityType ?? resolveTableActivity(tableName, operation) ?? null;

		await tx.insert(auditLogs).values({
			tableName,
			recordId,
			operation,
			oldValues: oldValues ?? null,
			newValues: newValues ?? null,
			changedBy: audit.userId,
			metadata: Object.keys(meta).length > 0 ? meta : null,
			activityType,
			stdNo: audit.stdNo ?? null,
			changedByRole: audit.role ?? null,
		});
	}

	protected async writeAuditLogBatch(
		tx: TransactionClient,
		entries: Array<{
			operation: 'INSERT' | 'UPDATE' | 'DELETE';
			recordId: string;
			oldValues: unknown;
			newValues: unknown;
		}>,
		audit: AuditOptions
	): Promise<void> {
		if (entries.length === 0) return;

		const tableName = this.getTableName();
		const values = entries.map((entry) => {
			const meta = {
				...this.buildAuditMetadata(
					entry.operation,
					entry.oldValues,
					entry.newValues
				),
				...audit.metadata,
			};

			const activityType =
				audit.activityType ??
				resolveTableActivity(tableName, entry.operation) ??
				null;

			return {
				tableName,
				recordId: entry.recordId,
				operation: entry.operation,
				oldValues: entry.oldValues ?? null,
				newValues: entry.newValues ?? null,
				changedBy: audit.userId,
				metadata: Object.keys(meta).length > 0 ? meta : null,
				activityType,
				stdNo: audit.stdNo ?? null,
				changedByRole: audit.role ?? null,
			};
		});

		await tx.insert(auditLogs).values(values);
	}

	private getColumn<K extends keyof ModelSelect<T>>(key: K): Column {
		return (this.table as unknown as Record<string, Column>)[key as string];
	}

	async findFirst(): Promise<ModelSelect<T> | undefined> {
		return await db
			.select()
			.from(this.table as unknown as Table)
			.limit(1)
			.then(([result]) => result);
	}

	async findById(
		id: ModelSelect<T>[PK]
	): Promise<ModelSelect<T> | null | undefined> {
		const result = await db
			.select()
			.from(this.table as unknown as Table)
			.where(eq(this.primaryKey, id));
		return result.length > 0 ? result[0] : null;
	}

	async findAll(): Promise<ModelSelect<T>[]> {
		const result = await db.select().from(this.table as unknown as Table);
		return result;
	}

	protected buildQueryCriteria(options: QueryOptions<T>) {
		const {
			page = 1,
			size = DEFAULT_PAGE_SIZE,
			search,
			searchColumns = [],
			sort = [],
			filter,
		} = options;

		const offset = (page - 1) * size;

		let orderBy = sort.map((sortOption) => {
			const column = this.getColumn(sortOption.column);
			return sql`${column} ${sortOption.order === 'desc' ? sql`DESC` : sql`ASC`} `;
		});

		if (orderBy.length === 0 && 'created_at' in this.table) {
			const createdAt = (this.table as unknown as Record<string, Column>)
				.created_at;
			if (createdAt) {
				orderBy = [sql`${createdAt} DESC`];
			}
		}

		let where: SQL | undefined;

		if (search && searchColumns.length > 0) {
			const searchCondition = or(
				...searchColumns.map(
					(column) =>
						sql`${this.getColumn(column as keyof ModelSelect<T>)}::text ILIKE ${`%${search}%`}`
				)
			);

			where = filter ? sql`${searchCondition} AND ${filter}` : searchCondition;
		} else {
			where = filter;
		}

		return {
			orderBy,
			where,
			offset,
			limit: size,
		};
	}

	protected async createPaginatedResult<E extends ModelSelect<T>>(
		items: E[],
		criteria: {
			where?: SQL;
			limit?: number;
		}
	) {
		const totalItems = await this.count(criteria.where);
		return {
			items,
			totalPages: Math.ceil(totalItems / (criteria.limit || DEFAULT_PAGE_SIZE)),
			totalItems,
		};
	}

	async query(options: QueryOptions<T>): Promise<{
		items: ModelSelect<T>[];
		totalPages: number;
		totalItems: number;
	}> {
		const { orderBy, where, offset, limit } = this.buildQueryCriteria(options);

		const items = await db
			.select()
			.from(this.table as unknown as Table)
			.orderBy(...orderBy)
			.where(where)
			.limit(limit)
			.offset(offset);

		return await this.createPaginatedResult(items, { where, limit });
	}

	async exists(id: ModelSelect<T>[PK]): Promise<boolean> {
		const [result] = await db
			.select({ count: count() })
			.from(this.table as unknown as Table)
			.where(eq(this.primaryKey, id))
			.limit(1);
		return result?.count > 0;
	}

	async create(
		entity: ModelInsert<T>,
		audit?: AuditOptions
	): Promise<ModelSelect<T>> {
		if (!this.shouldAudit(audit)) {
			const result = await db.insert(this.table).values(entity).returning();
			return (result as ModelSelect<T>[])[0];
		}

		return db.transaction(async (tx) => {
			const result = await tx.insert(this.table).values(entity).returning();
			const created = (result as ModelSelect<T>[])[0];

			await this.writeAuditLog(
				tx,
				'INSERT',
				this.getRecordId(created),
				null,
				created,
				audit
			);

			return created;
		});
	}

	async createMany(
		entities: ModelInsert<T>[],
		audit?: AuditOptions
	): Promise<ModelSelect<T>[]> {
		if (entities.length === 0) {
			return [];
		}

		if (!this.shouldAudit(audit)) {
			const result = await db.insert(this.table).values(entities).returning();
			return result as ModelSelect<T>[];
		}

		return db.transaction(async (tx) => {
			const result = await tx.insert(this.table).values(entities).returning();
			const created = result as ModelSelect<T>[];

			await this.writeAuditLogBatch(
				tx,
				created.map((record) => ({
					operation: 'INSERT' as const,
					recordId: this.getRecordId(record),
					oldValues: null,
					newValues: record,
				})),
				audit
			);

			return created;
		});
	}

	async update(
		id: ModelSelect<T>[PK],
		entity: Partial<ModelInsert<T>>,
		audit?: AuditOptions
	): Promise<ModelSelect<T>> {
		if (!this.shouldAudit(audit)) {
			const [updated] = (await db
				.update(this.table)
				.set(entity)
				.where(eq(this.primaryKey, id))
				.returning()) as ModelSelect<T>[];
			return updated;
		}

		return db.transaction(async (tx) => {
			const [old] = await tx
				.select()
				.from(this.table as unknown as Table)
				.where(eq(this.primaryKey, id));

			const [updated] = (await tx
				.update(this.table)
				.set(entity)
				.where(eq(this.primaryKey, id))
				.returning()) as ModelSelect<T>[];

			if (old) {
				await this.writeAuditLog(tx, 'UPDATE', String(id), old, updated, audit);
			}

			return updated;
		});
	}

	async delete(id: ModelSelect<T>[PK], audit?: AuditOptions): Promise<void> {
		if (!this.shouldAudit(audit)) {
			await db.delete(this.table).where(eq(this.primaryKey, id));
			return;
		}

		await db.transaction(async (tx) => {
			const [old] = await tx
				.select()
				.from(this.table as unknown as Table)
				.where(eq(this.primaryKey, id));

			await tx.delete(this.table).where(eq(this.primaryKey, id));

			if (old) {
				await this.writeAuditLog(tx, 'DELETE', String(id), old, null, audit);
			}
		});
	}

	async deleteById(
		id: ModelSelect<T>[PK],
		audit?: AuditOptions
	): Promise<boolean> {
		if (!this.shouldAudit(audit)) {
			const result = await db
				.delete(this.table)
				.where(eq(this.primaryKey, id))
				.returning();
			return (result as ModelSelect<T>[]).length > 0;
		}

		return db.transaction(async (tx) => {
			const [old] = await tx
				.select()
				.from(this.table as unknown as Table)
				.where(eq(this.primaryKey, id));

			const result = await tx
				.delete(this.table)
				.where(eq(this.primaryKey, id))
				.returning();

			if (old) {
				await this.writeAuditLog(tx, 'DELETE', String(id), old, null, audit);
			}

			return (result as ModelSelect<T>[]).length > 0;
		});
	}

	async updateById(
		id: ModelSelect<T>[PK],
		entity: Partial<ModelInsert<T>>,
		audit?: AuditOptions
	) {
		return this.update(id, entity, audit);
	}

	async count(filter?: SQL): Promise<number> {
		const query = db
			.select({ count: count() })
			.from(this.table as unknown as Table);
		const [result] = await (filter ? query.where(filter) : query);
		return result?.count ?? 0;
	}

	async deleteAll(): Promise<void> {
		await db.delete(this.table);
	}
}

export default BaseRepository;
