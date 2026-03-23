import { APPROVAL_PRESET_ROLES } from '@registry/student-statuses/_lib/approvalRoles';
import { and, count as countFn, eq, gte, inArray, or, sql } from 'drizzle-orm';
import {
	db,
	mailAccounts,
	mailQueue,
	mailSentLog,
	permissionPresets,
	programs,
	structures,
	studentPrograms,
	studentStatusApprovals,
	studentStatuses,
	students,
	userSchools,
	users,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
} from '@/core/platform/BaseRepository';
import type { MailTriggerType } from '../../_lib/types';

class MailQueueRepository extends BaseRepository<typeof mailQueue, 'id'> {
	constructor() {
		super(mailQueue, mailQueue.id);
	}
	async getSentLogEntry(id: number) {
		const [row] = await db
			.select({
				id: mailSentLog.id,
				to: mailSentLog.to,
				cc: mailSentLog.cc,
				bcc: mailSentLog.bcc,
				subject: mailSentLog.subject,
				snippet: mailSentLog.snippet,
				status: mailSentLog.status,
				error: mailSentLog.error,
				sentAt: mailSentLog.sentAt,
				gmailMessageId: mailSentLog.gmailMessageId,
				triggerType: mailSentLog.triggerType,
				triggerEntityId: mailSentLog.triggerEntityId,
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
			.where(eq(mailSentLog.id, id))
			.limit(1);
		return row ?? null;
	}

	async getQueueItem(id: number) {
		const [row] = await db
			.select({
				id: mailQueue.id,
				to: mailQueue.to,
				cc: mailQueue.cc,
				subject: mailQueue.subject,
				status: mailQueue.status,
				attempts: mailQueue.attempts,
				maxAttempts: mailQueue.maxAttempts,
				error: mailQueue.error,
				triggerType: mailQueue.triggerType,
				scheduledAt: mailQueue.scheduledAt,
				createdAt: mailQueue.createdAt,
			})
			.from(mailQueue)
			.where(eq(mailQueue.id, id))
			.limit(1);
		return row ?? null;
	}

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
				maxAttempts: mailQueue.maxAttempts,
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

	async resetToRetry(id: number, audit?: AuditOptions) {
		await db.transaction(async (tx) => {
			const [old] = await tx
				.select()
				.from(mailQueue)
				.where(and(eq(mailQueue.id, id), eq(mailQueue.status, 'failed')))
				.limit(1);

			if (!old) return;

			await tx
				.update(mailQueue)
				.set({ status: 'pending', error: null, attempts: 0 })
				.where(eq(mailQueue.id, id));

			if (audit) {
				await this.writeAuditLog(
					tx,
					'UPDATE',
					String(id),
					old,
					{ ...old, status: 'pending', error: null, attempts: 0 },
					audit
				);
			}
		});
	}

	async cancelQueued(id: number, audit?: AuditOptions) {
		await db.transaction(async (tx) => {
			const [old] = await tx
				.select()
				.from(mailQueue)
				.where(and(eq(mailQueue.id, id), eq(mailQueue.status, 'pending')))
				.limit(1);

			if (!old) return;

			await tx.delete(mailQueue).where(eq(mailQueue.id, id));

			if (audit) {
				await this.writeAuditLog(tx, 'DELETE', String(id), old, null, audit);
			}
		});
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

	async isDuplicate(
		triggerType: MailTriggerType,
		triggerEntityId: string,
		windowMinutes = 5
	) {
		const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
		const [row] = await db
			.select({ id: mailQueue.id })
			.from(mailQueue)
			.where(
				and(
					eq(mailQueue.triggerType, triggerType),
					eq(mailQueue.triggerEntityId, triggerEntityId),
					gte(mailQueue.createdAt, cutoff)
				)
			)
			.limit(1);
		return !!row;
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

export const mailQueueRepo = new MailQueueRepository();

const ROLE_TO_PRESETS = buildRoleToPresetsMap();

function buildRoleToPresetsMap() {
	const map: Record<string, string[]> = {};
	for (const [presetName, roles] of Object.entries(APPROVAL_PRESET_ROLES)) {
		for (const role of roles) {
			if (!map[role]) map[role] = [];
			map[role].push(presetName);
		}
	}
	return map;
}

export async function resolveStudentEmail(
	stdNo: number
): Promise<string | null> {
	const [row] = await db
		.select({ email: users.email })
		.from(students)
		.innerJoin(users, eq(students.userId, users.id))
		.where(eq(students.stdNo, stdNo))
		.limit(1);
	return row?.email ?? null;
}

const SCHOOL_SCOPED_ROLES = new Set(['year_leader', 'program_leader']);

export async function resolveApproverEmails(
	statusId: string
): Promise<string[]> {
	const approvals = await db
		.select({ approverRole: studentStatusApprovals.approverRole })
		.from(studentStatusApprovals)
		.where(
			and(
				eq(studentStatusApprovals.applicationId, statusId),
				eq(studentStatusApprovals.status, 'pending')
			)
		);

	const roles = [...new Set(approvals.map((a) => a.approverRole))];
	if (roles.length === 0) return [];

	const schoolPresets: string[] = [];
	const globalPresets: string[] = [];
	for (const role of roles) {
		const names = ROLE_TO_PRESETS[role];
		if (!names) continue;
		if (SCHOOL_SCOPED_ROLES.has(role)) {
			schoolPresets.push(...names);
		} else {
			globalPresets.push(...names);
		}
	}

	if (schoolPresets.length === 0 && globalPresets.length === 0) return [];

	const emails: string[] = [];

	if (globalPresets.length > 0) {
		const rows = await db
			.select({ email: users.email })
			.from(users)
			.innerJoin(permissionPresets, eq(users.presetId, permissionPresets.id))
			.where(inArray(permissionPresets.name, globalPresets));
		emails.push(...rows.map((r) => r.email));
	}

	if (schoolPresets.length > 0) {
		const [schoolRow] = await db
			.select({ schoolId: programs.schoolId })
			.from(studentStatuses)
			.innerJoin(
				studentPrograms,
				and(
					eq(studentPrograms.stdNo, studentStatuses.stdNo),
					eq(studentPrograms.status, 'Active')
				)
			)
			.innerJoin(structures, eq(structures.id, studentPrograms.structureId))
			.innerJoin(programs, eq(programs.id, structures.programId))
			.where(eq(studentStatuses.id, statusId))
			.limit(1);

		if (schoolRow) {
			const rows = await db
				.select({ email: users.email })
				.from(users)
				.innerJoin(permissionPresets, eq(users.presetId, permissionPresets.id))
				.innerJoin(userSchools, eq(userSchools.userId, users.id))
				.where(
					and(
						inArray(permissionPresets.name, schoolPresets),
						eq(userSchools.schoolId, schoolRow.schoolId)
					)
				);
			emails.push(...rows.map((r) => r.email));
		}
	}

	return [...new Set(emails)];
}

export async function resolveUserEmails(userIds: string[]): Promise<string[]> {
	if (userIds.length === 0) return [];
	const rows = await db
		.select({ email: users.email })
		.from(users)
		.where(inArray(users.id, userIds));
	return rows.map((r) => r.email);
}
