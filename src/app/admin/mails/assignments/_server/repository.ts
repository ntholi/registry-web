import { and, eq, or, sql } from 'drizzle-orm';
import { db, mailAccountAssignments, mailAccounts } from '@/core/database';
import BaseRepository, {
	type AuditOptions,
	type TransactionClient,
} from '@/core/platform/BaseRepository';

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

export const mailAssignmentRepo = new MailAssignmentRepository();
