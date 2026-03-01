import { and, count, eq, inArray, sql } from 'drizzle-orm';
import {
	db,
	studentSemesters,
	studentStatusApprovals,
	studentStatuses,
	students,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
	type QueryOptions,
} from '@/core/platform/BaseRepository';
import type {
	StudentStatusApprovalRole,
	StudentStatusEditableInput,
	StudentStatusState,
	StudentStatusType,
} from '../_lib/types';

type ApprovalRole = StudentStatusApprovalRole;

interface ApprovalResponse {
	status: 'approved' | 'rejected';
	respondedBy: string;
	message?: string;
}

export default class StudentStatusRepository extends BaseRepository<
	typeof studentStatuses,
	'id'
> {
	constructor() {
		super(studentStatuses, studentStatuses.id);
	}

	async findById(id: number) {
		return db.query.studentStatuses.findFirst({
			where: eq(studentStatuses.id, id),
			with: {
				student: true,
				approvals: { with: { responder: true } },
				semester: true,
				creator: true,
			},
		});
	}

	async query(options: QueryOptions<typeof studentStatuses>) {
		const { page = 1, size = 10, search } = options;
		const offset = (page - 1) * size;

		const where = search
			? sql`${studentStatuses.stdNo}::text ILIKE ${`%${search}%`}`
			: undefined;

		const items = await db.query.studentStatuses.findMany({
			where,
			with: { student: true },
			orderBy: sql`${studentStatuses.createdAt} DESC`,
			limit: size,
			offset,
		});

		const [result] = await db
			.select({ count: count() })
			.from(studentStatuses)
			.where(where);

		const totalItems = result?.count ?? 0;
		return {
			items,
			totalPages: Math.ceil(totalItems / size),
			totalItems,
		};
	}

	async findByStdNo(stdNo: number, type?: StudentStatusType) {
		return db.query.studentStatuses.findMany({
			where: type
				? and(eq(studentStatuses.stdNo, stdNo), eq(studentStatuses.type, type))
				: eq(studentStatuses.stdNo, stdNo),
			with: { approvals: true },
			orderBy: sql`${studentStatuses.createdAt} DESC`,
		});
	}

	async hasPending(stdNo: number, type: StudentStatusType) {
		const result = await db.query.studentStatuses.findFirst({
			where: and(
				eq(studentStatuses.stdNo, stdNo),
				eq(studentStatuses.type, type),
				eq(studentStatuses.status, 'pending')
			),
		});
		return !!result;
	}

	async findStudentByStdNo(stdNo: number) {
		return db.query.students.findFirst({
			where: eq(students.stdNo, stdNo),
			columns: { stdNo: true, status: true },
		});
	}

	async findStudentSemesterById(id: number) {
		return db.query.studentSemesters.findFirst({
			where: eq(studentSemesters.id, id),
			columns: { status: true },
		});
	}

	async createWithApprovals(
		data: typeof studentStatuses.$inferInsert,
		approvalRoles: ApprovalRole[],
		audit?: AuditOptions
	) {
		return db.transaction(async (tx) => {
			const [created] = await tx
				.insert(studentStatuses)
				.values(data)
				.returning();

			if (approvalRoles.length > 0) {
				await tx.insert(studentStatusApprovals).values(
					approvalRoles.map((role) => ({
						applicationId: created.id,
						approverRole: role,
						status: 'pending' as const,
					}))
				);
			}

			if (audit) {
				await this.writeAuditLog(
					tx,
					'INSERT',
					String(created.id),
					null,
					created,
					{
						...audit,
						activityType: 'student_status_created',
						stdNo: data.stdNo,
					}
				);
			}

			return this.findById(created.id);
		});
	}

	async updateStatus(
		id: number,
		status: StudentStatusState,
		audit?: AuditOptions
	) {
		if (!audit) {
			const [updated] = await db
				.update(studentStatuses)
				.set({ status, updatedAt: new Date() })
				.where(eq(studentStatuses.id, id))
				.returning();
			return updated;
		}

		return db.transaction(async (tx) => {
			const [old] = await tx
				.select()
				.from(studentStatuses)
				.where(eq(studentStatuses.id, id));

			const [updated] = await tx
				.update(studentStatuses)
				.set({ status, updatedAt: new Date() })
				.where(eq(studentStatuses.id, id))
				.returning();

			if (old) {
				await this.writeAuditLog(tx, 'UPDATE', String(id), old, updated, {
					...audit,
					activityType: 'student_status_updated',
					stdNo: old.stdNo,
				});
			}

			return updated;
		});
	}

	async updateEditable(
		id: number,
		data: StudentStatusEditableInput,
		audit?: AuditOptions
	) {
		return this.update(
			id,
			{
				termCode: data.termCode,
				justification: data.justification,
				notes: data.notes,
				updatedAt: new Date(),
			},
			audit
		);
	}

	async respondToApproval(
		id: number,
		data: ApprovalResponse,
		audit?: AuditOptions
	) {
		if (!audit) {
			const [updated] = await db
				.update(studentStatusApprovals)
				.set({
					status: data.status,
					respondedBy: data.respondedBy,
					message: data.message,
					respondedAt: new Date(),
				})
				.where(eq(studentStatusApprovals.id, id))
				.returning();
			return updated;
		}

		return db.transaction(async (tx) => {
			const [old] = await tx
				.select()
				.from(studentStatusApprovals)
				.where(eq(studentStatusApprovals.id, id));

			const [updated] = await tx
				.update(studentStatusApprovals)
				.set({
					status: data.status,
					respondedBy: data.respondedBy,
					message: data.message,
					respondedAt: new Date(),
				})
				.where(eq(studentStatusApprovals.id, id))
				.returning();

			if (old) {
				await this.writeAuditLogForTable(
					tx,
					'student_status_approvals',
					'UPDATE',
					String(id),
					old,
					updated,
					{ ...audit, activityType: 'student_status_approval_updated' }
				);
			}

			return updated;
		});
	}

	async getApprovalsByAppId(appId: number) {
		return db.query.studentStatusApprovals.findMany({
			where: eq(studentStatusApprovals.applicationId, appId),
			with: { responder: true },
		});
	}

	async findApprovalById(id: number) {
		return db.query.studentStatusApprovals.findFirst({
			where: eq(studentStatusApprovals.id, id),
			with: { application: true },
		});
	}

	async findPendingByApproverRole(
		role: ApprovalRole,
		options?: QueryOptions<typeof studentStatuses>
	) {
		const { page = 1, size = 10, search } = options ?? {};
		const offset = (page - 1) * size;

		const conditions = [
			eq(studentStatusApprovals.approverRole, role),
			eq(studentStatusApprovals.status, 'pending'),
			eq(studentStatuses.status, 'pending'),
		];

		if (search) {
			conditions.push(
				sql`${studentStatuses.stdNo}::text ILIKE ${`%${search}%`}`
			);
		}

		const where = and(...conditions);

		const items = await db
			.select({ studentStatuses })
			.from(studentStatuses)
			.innerJoin(
				studentStatusApprovals,
				eq(studentStatusApprovals.applicationId, studentStatuses.id)
			)
			.where(where)
			.orderBy(sql`${studentStatuses.createdAt} DESC`)
			.limit(size)
			.offset(offset);

		const [result] = await db
			.select({ count: count() })
			.from(studentStatuses)
			.innerJoin(
				studentStatusApprovals,
				eq(studentStatusApprovals.applicationId, studentStatuses.id)
			)
			.where(where);

		const totalItems = result?.count ?? 0;
		return {
			items: items.map((row) => row.studentStatuses),
			totalPages: Math.ceil(totalItems / size),
			totalItems,
		};
	}

	async findPendingByApproverRoles(
		roles: ApprovalRole[],
		options?: QueryOptions<typeof studentStatuses>
	) {
		const { page = 1, size = 10, search } = options ?? {};
		const offset = (page - 1) * size;

		const conditions = [
			inArray(studentStatusApprovals.approverRole, roles),
			eq(studentStatusApprovals.status, 'pending'),
			eq(studentStatuses.status, 'pending'),
		];

		if (search) {
			conditions.push(
				sql`${studentStatuses.stdNo}::text ILIKE ${`%${search}%`}`
			);
		}

		const where = and(...conditions);

		const items = await db
			.select({ studentStatuses })
			.from(studentStatuses)
			.innerJoin(
				studentStatusApprovals,
				eq(studentStatusApprovals.applicationId, studentStatuses.id)
			)
			.where(where)
			.orderBy(sql`${studentStatuses.createdAt} DESC`)
			.limit(size)
			.offset(offset);

		const [result] = await db
			.select({ count: count() })
			.from(studentStatuses)
			.innerJoin(
				studentStatusApprovals,
				eq(studentStatusApprovals.applicationId, studentStatuses.id)
			)
			.where(where);

		const totalItems = result?.count ?? 0;
		return {
			items: items.map((row) => row.studentStatuses),
			totalPages: Math.ceil(totalItems / size),
			totalItems,
		};
	}

	async countPendingByApproverRoles(roles: ApprovalRole[]) {
		const [result] = await db
			.select({ count: count() })
			.from(studentStatuses)
			.innerJoin(
				studentStatusApprovals,
				eq(studentStatusApprovals.applicationId, studentStatuses.id)
			)
			.where(
				and(
					inArray(studentStatusApprovals.approverRole, roles),
					eq(studentStatusApprovals.status, 'pending'),
					eq(studentStatuses.status, 'pending')
				)
			);
		return result?.count ?? 0;
	}
}

export const studentStatusRepository = new StudentStatusRepository();
