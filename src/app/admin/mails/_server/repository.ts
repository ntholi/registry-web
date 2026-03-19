import { and, count as countFn, eq, gte, inArray, or, sql } from 'drizzle-orm';
import {
	db,
	mailAccountAssignments,
	mailAccounts,
	mailQueue,
	mailSentLog,
	users,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
	type QueryOptions,
	type TransactionClient,
} from '@/core/platform/BaseRepository';

class MailAccountRepository extends BaseRepository<typeof mailAccounts, 'id'> {
	constructor() {
		super(mailAccounts, mailAccounts.id);
	}

	override async findById(id: string) {
		return db.query.mailAccounts.findFirst({
			where: eq(mailAccounts.id, id),
			with: {
				user: { columns: { id: true, name: true, email: true, image: true } },
				assignments: {
					with: {
						user: { columns: { id: true, name: true, email: true } },
					},
				},
			},
		});
	}

	async search(options: QueryOptions<typeof mailAccounts>) {
		const { orderBy, where, offset, limit } = this.buildQueryCriteria({
			...options,
			searchColumns: options.searchColumns ?? ['email', 'displayName'],
		});

		const items = await db
			.select({
				id: mailAccounts.id,
				email: mailAccounts.email,
				displayName: mailAccounts.displayName,
				isPrimary: mailAccounts.isPrimary,
				isActive: mailAccounts.isActive,
				createdAt: mailAccounts.createdAt,
				updatedAt: mailAccounts.updatedAt,
				user: {
					id: users.id,
					name: users.name,
					email: users.email,
					image: users.image,
				},
			})
			.from(mailAccounts)
			.leftJoin(users, eq(mailAccounts.userId, users.id))
			.where(where)
			.orderBy(...orderBy)
			.limit(limit)
			.offset(offset);

		const totalItems = await this.count(where);
		return {
			items,
			totalPages: Math.ceil(totalItems / (limit || 15)),
			totalItems,
		};
	}

	async findByUserId(userId: string) {
		return db
			.select({
				id: mailAccounts.id,
				email: mailAccounts.email,
				displayName: mailAccounts.displayName,
				isPrimary: mailAccounts.isPrimary,
				isActive: mailAccounts.isActive,
				createdAt: mailAccounts.createdAt,
			})
			.from(mailAccounts)
			.where(eq(mailAccounts.userId, userId));
	}

	async findByEmail(email: string) {
		return db.query.mailAccounts.findFirst({
			where: eq(mailAccounts.email, email),
		});
	}

	async findPrimary() {
		return db.query.mailAccounts.findFirst({
			where: eq(mailAccounts.isPrimary, true),
		});
	}

	async findActive() {
		return db
			.select()
			.from(mailAccounts)
			.where(eq(mailAccounts.isActive, true));
	}

	async findActiveById(id: string) {
		const [account] = await db
			.select()
			.from(mailAccounts)
			.where(and(eq(mailAccounts.id, id), eq(mailAccounts.isActive, true)))
			.limit(1);
		return account;
	}

	async findActiveByEmail(email: string) {
		const [account] = await db
			.select()
			.from(mailAccounts)
			.where(
				and(eq(mailAccounts.email, email), eq(mailAccounts.isActive, true))
			)
			.limit(1);
		return account;
	}

	async findActivePrimary() {
		const [account] = await db
			.select()
			.from(mailAccounts)
			.where(
				and(eq(mailAccounts.isPrimary, true), eq(mailAccounts.isActive, true))
			)
			.limit(1);
		return account;
	}

	async markInactive(id: string) {
		await db
			.update(mailAccounts)
			.set({ isActive: false })
			.where(eq(mailAccounts.id, id));
	}

	async findByIds(ids: string[]) {
		if (ids.length === 0) return [];
		return db.select().from(mailAccounts).where(inArray(mailAccounts.id, ids));
	}

	async setPrimary(id: string, audit?: AuditOptions) {
		return db.transaction(async (tx) => {
			await tx
				.update(mailAccounts)
				.set({ isPrimary: false })
				.where(eq(mailAccounts.isPrimary, true));

			const [updated] = await tx
				.update(mailAccounts)
				.set({ isPrimary: true })
				.where(eq(mailAccounts.id, id))
				.returning();

			if (audit) {
				await this.writeAuditLog(
					tx,
					'UPDATE',
					id,
					{ isPrimary: false },
					{ isPrimary: true },
					{ ...audit, activityType: 'mail_primary_changed' }
				);
			}

			return updated;
		});
	}

	async updateTokens(
		id: string,
		tokens: {
			accessToken?: string;
			refreshToken?: string;
			tokenExpiresAt?: Date;
		}
	) {
		const [updated] = await db
			.update(mailAccounts)
			.set(tokens)
			.where(eq(mailAccounts.id, id))
			.returning();
		return updated;
	}

	async revokeAccount(id: string, audit?: AuditOptions) {
		return db.transaction(async (tx) => {
			const [old] = await tx
				.select()
				.from(mailAccounts)
				.where(eq(mailAccounts.id, id));

			await tx
				.delete(mailAccountAssignments)
				.where(eq(mailAccountAssignments.mailAccountId, id));

			await tx.delete(mailAccounts).where(eq(mailAccounts.id, id));

			if (audit && old) {
				await this.writeAuditLog(tx, 'DELETE', id, old, null, audit);
			}
		});
	}
}

class MailAssignmentRepository extends BaseRepository<
	typeof mailAccountAssignments,
	'id'
> {
	constructor() {
		super(mailAccountAssignments, mailAccountAssignments.id);
	}

	async findByAccountId(accountId: string) {
		return db.query.mailAccountAssignments.findMany({
			where: eq(mailAccountAssignments.mailAccountId, accountId),
			with: {
				user: { columns: { id: true, name: true, email: true } },
			},
		});
	}

	async findByRole(role: string) {
		return db
			.select()
			.from(mailAccountAssignments)
			.where(eq(mailAccountAssignments.role, role));
	}

	async findByUserId(userId: string) {
		return db
			.select()
			.from(mailAccountAssignments)
			.where(eq(mailAccountAssignments.userId, userId));
	}

	async findAccessibleAccounts(userId: string, role: string) {
		return db
			.select({
				id: mailAccounts.id,
				email: mailAccounts.email,
				displayName: mailAccounts.displayName,
				isPrimary: mailAccounts.isPrimary,
				isActive: mailAccounts.isActive,
				canCompose: sql<boolean>`bool_or(${mailAccountAssignments.canCompose})`,
				canReply: sql<boolean>`bool_or(${mailAccountAssignments.canReply})`,
			})
			.from(mailAccountAssignments)
			.innerJoin(
				mailAccounts,
				and(
					eq(mailAccountAssignments.mailAccountId, mailAccounts.id),
					eq(mailAccounts.isActive, true)
				)
			)
			.where(
				or(
					eq(mailAccountAssignments.userId, userId),
					eq(mailAccountAssignments.role, role)
				)
			)
			.groupBy(
				mailAccounts.id,
				mailAccounts.email,
				mailAccounts.displayName,
				mailAccounts.isPrimary,
				mailAccounts.isActive
			);
	}

	async deleteByAccountId(accountId: string, audit?: AuditOptions) {
		if (!audit) {
			await db
				.delete(mailAccountAssignments)
				.where(eq(mailAccountAssignments.mailAccountId, accountId));
			return;
		}

		await db.transaction(async (tx: TransactionClient) => {
			const existing = await tx
				.select()
				.from(mailAccountAssignments)
				.where(eq(mailAccountAssignments.mailAccountId, accountId));

			await tx
				.delete(mailAccountAssignments)
				.where(eq(mailAccountAssignments.mailAccountId, accountId));

			if (existing.length > 0) {
				await this.writeAuditLogBatch(
					tx,
					existing.map((a) => ({
						operation: 'DELETE' as const,
						recordId: String(a.id),
						oldValues: a,
						newValues: null,
					})),
					audit
				);
			}
		});
	}
}

class MailQueueRepository {
	async insertSentLog(values: typeof mailSentLog.$inferInsert) {
		await db.insert(mailSentLog).values(values);
	}

	async enqueue(values: typeof mailQueue.$inferInsert) {
		await db.insert(mailQueue).values(values);
	}

	async claimBatch(batchSize: number) {
		return db.transaction(async (tx) => {
			const claimed = await tx
				.update(mailQueue)
				.set({
					status: 'processing',
					attempts: sql`${mailQueue.attempts} + 1`,
					processedAt: new Date(),
				})
				.where(
					sql`${mailQueue.id} IN (
						SELECT id FROM mail_queue
						WHERE (status = 'pending' OR status = 'retry')
						AND scheduled_at <= NOW()
						ORDER BY scheduled_at ASC
						LIMIT ${batchSize}
						FOR UPDATE SKIP LOCKED
					)`
				)
				.returning();

			return claimed;
		});
	}

	async markSent(
		id: number,
		gmailMessageId: string,
		queueRow: typeof mailQueue.$inferSelect
	) {
		return db.transaction(async (tx) => {
			await tx
				.update(mailQueue)
				.set({ status: 'sent', sentAt: new Date(), error: null })
				.where(eq(mailQueue.id, id));

			await tx.insert(mailSentLog).values({
				mailAccountId: queueRow.mailAccountId,
				queueId: id,
				gmailMessageId,
				to: queueRow.to,
				cc: queueRow.cc,
				bcc: queueRow.bcc,
				subject: queueRow.subject,
				status: 'sent',
				sentByUserId: queueRow.sentByUserId,
				triggerType: queueRow.triggerType,
				triggerEntityId: queueRow.triggerEntityId,
			});
		});
	}

	async markFailed(id: number, error: string) {
		await db
			.update(mailQueue)
			.set({ status: 'failed', error })
			.where(eq(mailQueue.id, id));
	}

	async markRetry(id: number, error: string, nextScheduledAt: Date) {
		await db
			.update(mailQueue)
			.set({ status: 'retry', error, scheduledAt: nextScheduledAt })
			.where(eq(mailQueue.id, id));
	}

	async markBatchRetry(ids: number[], error: string, nextScheduledAt: Date) {
		if (ids.length === 0) return;
		await db
			.update(mailQueue)
			.set({
				status: 'retry',
				error,
				scheduledAt: nextScheduledAt,
				attempts: sql`${mailQueue.attempts} - 1`,
			})
			.where(inArray(mailQueue.id, ids));
	}

	async getDailySendCounts(accountIds: string[]): Promise<Map<string, number>> {
		if (accountIds.length === 0) return new Map();

		const todayStart = new Date();
		todayStart.setUTCHours(0, 0, 0, 0);

		const rows = await db
			.select({
				mailAccountId: mailSentLog.mailAccountId,
				count: countFn(),
			})
			.from(mailSentLog)
			.where(
				and(
					inArray(mailSentLog.mailAccountId, accountIds),
					gte(mailSentLog.sentAt, todayStart),
					eq(mailSentLog.status, 'sent')
				)
			)
			.groupBy(mailSentLog.mailAccountId);

		return new Map(rows.map((r) => [r.mailAccountId, r.count]));
	}

	async getQueueCounts() {
		const rows = await db
			.select({
				status: mailQueue.status,
				count: countFn(),
			})
			.from(mailQueue)
			.groupBy(mailQueue.status);

		return Object.fromEntries(rows.map((r) => [r.status, r.count])) as Record<
			string,
			number
		>;
	}

	async getQueueItems(page: number, status?: string) {
		const limit = 15;
		const offset = (page - 1) * limit;
		const conditions = status
			? eq(
					mailQueue.status,
					status as (typeof mailQueue.status.enumValues)[number]
				)
			: undefined;

		const items = await db
			.select({
				id: mailQueue.id,
				to: mailQueue.to,
				subject: mailQueue.subject,
				status: mailQueue.status,
				attempts: mailQueue.attempts,
				error: mailQueue.error,
				triggerType: mailQueue.triggerType,
				scheduledAt: mailQueue.scheduledAt,
				sentAt: mailQueue.sentAt,
				createdAt: mailQueue.createdAt,
			})
			.from(mailQueue)
			.where(conditions)
			.orderBy(sql`${mailQueue.createdAt} DESC`)
			.limit(limit)
			.offset(offset);

		const [{ count: totalItems }] = await db
			.select({ count: countFn() })
			.from(mailQueue)
			.where(conditions);

		return {
			items,
			totalPages: Math.ceil(totalItems / limit),
			totalItems,
		};
	}

	async resetToRetry(id: number) {
		await db
			.update(mailQueue)
			.set({ status: 'pending', error: null, attempts: 0 })
			.where(and(eq(mailQueue.id, id), eq(mailQueue.status, 'failed')));
	}

	async cancelQueued(id: number) {
		await db
			.delete(mailQueue)
			.where(and(eq(mailQueue.id, id), eq(mailQueue.status, 'pending')));
	}

	async getSentLog(page: number, search?: string) {
		const limit = 15;
		const offset = (page - 1) * limit;
		const conditions = search
			? or(
					sql`${mailSentLog.to} ILIKE ${`%${search}%`}`,
					sql`${mailSentLog.subject} ILIKE ${`%${search}%`}`
				)
			: undefined;

		const items = await db
			.select({
				id: mailSentLog.id,
				to: mailSentLog.to,
				cc: mailSentLog.cc,
				subject: mailSentLog.subject,
				status: mailSentLog.status,
				sentAt: mailSentLog.sentAt,
				triggerType: mailSentLog.triggerType,
				sentByUser: {
					id: users.id,
					name: users.name,
					email: users.email,
				},
				account: {
					id: mailAccounts.id,
					email: mailAccounts.email,
				},
			})
			.from(mailSentLog)
			.leftJoin(users, eq(mailSentLog.sentByUserId, users.id))
			.leftJoin(mailAccounts, eq(mailSentLog.mailAccountId, mailAccounts.id))
			.where(conditions)
			.orderBy(sql`${mailSentLog.sentAt} DESC`)
			.limit(limit)
			.offset(offset);

		const [{ count: totalItems }] = await db
			.select({ count: countFn() })
			.from(mailSentLog)
			.where(conditions);

		return {
			items,
			totalPages: Math.ceil(totalItems / limit),
			totalItems,
		};
	}

	async getDailyStatsForAccount(accountId: string) {
		const todayStart = new Date();
		todayStart.setUTCHours(0, 0, 0, 0);

		const [{ count: sentToday }] = await db
			.select({ count: countFn() })
			.from(mailSentLog)
			.where(
				and(
					eq(mailSentLog.mailAccountId, accountId),
					gte(mailSentLog.sentAt, todayStart),
					eq(mailSentLog.status, 'sent')
				)
			);

		const limit = Number(process.env.MAIL_DAILY_LIMIT) || 1900;
		return { sentToday, remaining: Math.max(0, limit - sentToday), limit };
	}
}

export const mailAccountRepo = new MailAccountRepository();
export const mailAssignmentRepo = new MailAssignmentRepository();
export const mailQueueRepo = new MailQueueRepository();
