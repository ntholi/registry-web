import { and, eq, inArray } from 'drizzle-orm';
import {
	db,
	mailAccountAssignments,
	mailAccounts,
	users,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
	type QueryOptions,
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

export const mailAccountRepo = new MailAccountRepository();
