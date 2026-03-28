'use server';

import { and, count, eq, type SQL, sql } from 'drizzle-orm';
import {
	db,
	referralSessions,
	studentReferrals,
	students,
	users,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export default class ReferralRepository extends BaseRepository<
	typeof studentReferrals,
	'id'
> {
	constructor() {
		super(studentReferrals, studentReferrals.id);
	}

	override async findById(id: string) {
		return db.query.studentReferrals.findFirst({
			where: eq(studentReferrals.id, id),
			with: {
				student: { columns: { stdNo: true, name: true } },
				referrer: { columns: { id: true, name: true, email: true } },
				assignee: { columns: { id: true, name: true } },
				closer: { columns: { id: true, name: true } },
				sessions: {
					with: {
						conductor: { columns: { id: true, name: true } },
					},
					orderBy: (s, { desc }) => [desc(s.createdAt)],
				},
			},
		});
	}

	override async query(options: QueryOptions<typeof studentReferrals>) {
		const { orderBy, where, offset, limit } = this.buildQueryCriteria(options);

		const items = await db
			.select({
				id: studentReferrals.id,
				stdNo: studentReferrals.stdNo,
				reason: studentReferrals.reason,
				status: studentReferrals.status,
				createdAt: studentReferrals.createdAt,
				studentName: students.name,
				referrerName: users.name,
			})
			.from(studentReferrals)
			.innerJoin(
				students,
				sql`${studentReferrals.stdNo}::bigint = ${students.stdNo}`
			)
			.innerJoin(users, eq(studentReferrals.referredBy, users.id))
			.where(where)
			.orderBy(...orderBy)
			.limit(limit)
			.offset(offset);

		return this.createPaginatedResult(
			items as unknown as (typeof studentReferrals.$inferSelect)[],
			{ where, limit }
		);
	}

	async countPending(filter?: SQL) {
		const conditions: SQL[] = [eq(studentReferrals.status, 'pending')];
		if (filter) conditions.push(filter);

		const [result] = await db
			.select({ count: count() })
			.from(studentReferrals)
			.where(and(...conditions));
		return result?.count ?? 0;
	}

	async addSession(
		data: typeof referralSessions.$inferInsert,
		audit?: AuditOptions
	) {
		return db.transaction(async (tx) => {
			const [session] = await tx
				.insert(referralSessions)
				.values(data)
				.returning();

			if (audit) {
				await this.writeAuditLogForTable(
					tx,
					'referral_sessions',
					'INSERT',
					session.id,
					null,
					session,
					audit
				);
			}

			return session;
		});
	}

	async deleteSession(id: string, audit?: AuditOptions) {
		return db.transaction(async (tx) => {
			const [old] = await tx
				.select()
				.from(referralSessions)
				.where(eq(referralSessions.id, id));

			if (!old) return;

			await tx.delete(referralSessions).where(eq(referralSessions.id, id));

			if (audit) {
				await this.writeAuditLogForTable(
					tx,
					'referral_sessions',
					'DELETE',
					id,
					old,
					null,
					audit
				);
			}
		});
	}

	async findSessionsByReferral(referralId: string) {
		return db.query.referralSessions.findMany({
			where: eq(referralSessions.referralId, referralId),
			with: {
				conductor: { columns: { id: true, name: true } },
			},
			orderBy: (s, { desc }) => [desc(s.sessionDate)],
		});
	}
}
