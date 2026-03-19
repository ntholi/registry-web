import { and, eq, or, sql } from 'drizzle-orm';
import {
	db,
	mailAccountAssignments,
	mailAccounts,
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

export const mailAccountRepo = new MailAccountRepository();
export const mailAssignmentRepo = new MailAssignmentRepository();
