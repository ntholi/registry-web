import StudentRepository from '@registry/students/_server/repository';
import { eq } from 'drizzle-orm';
import type { Session } from 'next-auth';
import { db, studentSemesters, students } from '@/core/database';
import type {
	AuditOptions,
	QueryOptions,
} from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth, { requireSessionUserId } from '@/core/platform/withAuth';
import type { studentStatusApprovalRole } from '../_schema/studentStatusApprovals';
import type { studentStatuses } from '../_schema/studentStatuses';
import { studentStatusRepository } from './repository';

type ApprovalRole = (typeof studentStatusApprovalRole.enumValues)[number];

function canUserApproveRole(session: Session, approverRole: ApprovalRole) {
	const user = session.user!;
	const { role, position } = user;
	switch (approverRole) {
		case 'year_leader':
			return role === 'academic' && position === 'year_leader';
		case 'program_leader':
			return (
				role === 'academic' &&
				(position === 'manager' || position === 'program_leader')
			);
		case 'student_services':
			return role === 'student_services';
		case 'finance':
			return role === 'finance';
		default:
			return false;
	}
}

function getUserApprovalRoles(session: Session): ApprovalRole[] {
	const roles: ApprovalRole[] = [];
	const user = session.user!;
	const { role, position } = user;
	if (role === 'academic') {
		if (position === 'year_leader') roles.push('year_leader');
		if (position === 'manager' || position === 'program_leader')
			roles.push('program_leader');
	}
	if (role === 'student_services') roles.push('student_services');
	if (role === 'finance') roles.push('finance');
	return roles;
}

class StudentStatusService {
	private repository = studentStatusRepository;

	async get(id: number) {
		return withAuth(async () => {
			return this.repository.findById(id);
		}, ['dashboard']);
	}

	async getAll(options: QueryOptions<typeof studentStatuses>) {
		return withAuth(async () => {
			return this.repository.query(options);
		}, ['registry', 'admin']);
	}

	async getByStdNo(stdNo: number) {
		return withAuth(async () => {
			return this.repository.findByStdNo(stdNo);
		}, ['dashboard']);
	}

	async getPendingForApproval(options: QueryOptions<typeof studentStatuses>) {
		return withAuth(
			async (session) => {
				const roles = getUserApprovalRoles(session!);
				if (roles.length === 0) throw new Error('No approval roles for user');
				return this.repository.findPendingByApproverRoles(roles, options);
			},
			async (session) => {
				return getUserApprovalRoles(session).length > 0;
			}
		);
	}

	async countPendingForCurrentUser() {
		return withAuth(
			async (session) => {
				const roles = getUserApprovalRoles(session!);
				if (roles.length === 0) return 0;
				return this.repository.countPendingByApproverRoles(roles);
			},
			async (session) => {
				return getUserApprovalRoles(session).length > 0;
			}
		);
	}

	async create(data: typeof studentStatuses.$inferInsert) {
		return withAuth(
			async (session) => {
				const userId = requireSessionUserId(session);

				const student = await db.query.students.findFirst({
					where: eq(students.stdNo, data.stdNo),
					columns: { stdNo: true, status: true },
				});
				if (!student) throw new Error('Student not found');

				const hasPending = await this.repository.hasPending(
					data.stdNo,
					data.type
				);
				if (hasPending)
					throw new Error(
						`Student already has a pending ${data.type} application`
					);

				if (data.type === 'withdrawal' || data.type === 'deferment') {
					if (!data.semesterId)
						throw new Error('Semester is required for withdrawal/deferment');
				}

				if (data.type === 'reinstatement') {
					const isEligibleByStatus =
						student.status === 'Withdrawn' || student.status === 'Terminated';

					let isEligibleBySemester = false;
					if (!isEligibleByStatus) {
						const semester = await db.query.studentSemesters.findFirst({
							where: eq(studentSemesters.id, data.semesterId!),
							columns: { status: true },
						});
						isEligibleBySemester =
							semester?.status === 'Deferred' ||
							semester?.status === 'Withdrawn';
					}

					if (!isEligibleByStatus && !isEligibleBySemester)
						throw new Error('Student is not eligible for reinstatement');
				}

				const approvalRoles: ApprovalRole[] =
					data.type === 'reinstatement'
						? ['program_leader', 'finance']
						: ['year_leader', 'program_leader', 'student_services', 'finance'];

				const audit: AuditOptions = {
					userId,
					activityType: 'student_status_created',
					stdNo: data.stdNo,
					role: session!.user!.role,
				};

				return this.repository.createWithApprovals(
					{ ...data, createdBy: userId },
					approvalRoles,
					audit
				);
			},
			['registry', 'admin']
		);
	}

	async cancel(id: number) {
		return withAuth(
			async (session) => {
				const userId = requireSessionUserId(session);

				const app = await this.repository.findById(id);
				if (!app) throw new Error('Application not found');
				if (app.status !== 'pending')
					throw new Error('Only pending applications can be cancelled');

				const audit: AuditOptions = {
					userId,
					activityType: 'student_status_cancelled',
					stdNo: app.stdNo,
					role: session!.user!.role,
				};

				return this.repository.updateStatus(id, 'cancelled', audit);
			},
			['registry', 'admin']
		);
	}

	async approve(approvalId: number) {
		return withAuth(
			async (session) => {
				const userId = requireSessionUserId(session);

				const approval = await this.repository.findApprovalById(approvalId);
				if (!approval) throw new Error('Approval step not found');
				if (!canUserApproveRole(session!, approval.approverRole))
					throw new Error('Unauthorized for this approval step');

				const app = approval.application;
				if (app.status !== 'pending')
					throw new Error('Application is no longer pending');
				if (approval.status !== 'pending')
					throw new Error('Approval step is no longer pending');

				const audit: AuditOptions = {
					userId,
					activityType: 'student_status_approved',
					stdNo: app.stdNo,
					role: session!.user!.role,
				};

				await this.repository.respondToApproval(
					approvalId,
					{ status: 'approved', respondedBy: userId },
					audit
				);

				const allApprovals = await this.repository.getApprovalsByAppId(app.id);
				const allApproved = allApprovals.every((a) => a.status === 'approved');

				if (allApproved) {
					await this.onAllApproved(app, session!);
				}

				return this.repository.findById(app.id);
			},
			['dashboard']
		);
	}

	async reject(approvalId: number, message?: string) {
		return withAuth(
			async (session) => {
				const userId = requireSessionUserId(session);

				const approval = await this.repository.findApprovalById(approvalId);
				if (!approval) throw new Error('Approval step not found');
				if (!canUserApproveRole(session!, approval.approverRole))
					throw new Error('Unauthorized for this approval step');

				const app = approval.application;
				if (app.status !== 'pending')
					throw new Error('Application is no longer pending');
				if (approval.status !== 'pending')
					throw new Error('Approval step is no longer pending');

				const audit: AuditOptions = {
					userId,
					activityType: 'student_status_rejected',
					stdNo: app.stdNo,
					role: session!.user!.role,
				};

				await this.repository.respondToApproval(
					approvalId,
					{ status: 'rejected', respondedBy: userId, message },
					audit
				);

				await this.repository.updateStatus(app.id, 'rejected', audit);

				return this.repository.findById(app.id);
			},
			['dashboard']
		);
	}

	private async onAllApproved(
		app: { id: number; type: string; stdNo: number; semesterId: number | null },
		session: Session
	) {
		const user = session.user!;
		const userId = user.id!;
		const studentRepo = new StudentRepository();

		if (app.type === 'withdrawal') {
			await studentRepo.updateStudentWithAudit(
				app.stdNo,
				{ status: 'Withdrawn' },
				{
					userId,
					activityType: 'student_update',
					stdNo: app.stdNo,
					role: user.role,
					metadata: { reasons: 'Withdrawal application approved' },
				}
			);

			if (app.semesterId) {
				await studentRepo.updateStudentSemester(
					app.semesterId,
					{ status: 'Withdrawn' },
					{
						userId,
						activityType: 'semester_withdrawal',
						stdNo: app.stdNo,
						role: user.role,
						metadata: { reasons: 'Withdrawal application approved' },
					}
				);
			}
		}

		if (app.type === 'deferment' && app.semesterId) {
			await studentRepo.updateStudentSemester(
				app.semesterId,
				{ status: 'Deferred' },
				{
					userId,
					activityType: 'semester_withdrawal',
					stdNo: app.stdNo,
					role: user.role,
					metadata: { reasons: 'Deferment application approved' },
				}
			);
		}

		const audit: AuditOptions = {
			userId,
			activityType: 'student_status_approved',
			stdNo: app.stdNo,
			role: user.role,
		};

		await this.repository.updateStatus(app.id, 'approved', audit);
	}
}

export const studentStatusesService = serviceWrapper(
	StudentStatusService,
	'StudentStatusService'
);
