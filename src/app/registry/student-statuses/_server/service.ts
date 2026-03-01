import {
	updateStudentForStatusWorkflow,
	updateStudentSemesterForStatusWorkflow,
} from '@registry/students/_server/actions';
import type { Session } from 'next-auth';
import type { studentStatuses } from '@/core/database';
import type {
	AuditOptions,
	QueryOptions,
} from '@/core/platform/BaseRepository';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth, { requireSessionUserId } from '@/core/platform/withAuth';
import {
	canUserApproveRole,
	getUserApprovalRoles,
} from '../_lib/approvalRoles';
import type {
	StudentStatusApprovalRole,
	StudentStatusEditableInput,
	StudentStatusType,
} from '../_lib/types';
import type StudentStatusRepository from './repository';
import { studentStatusRepository } from './repository';

class StudentStatusService extends BaseService<typeof studentStatuses, 'id'> {
	declare repository: StudentStatusRepository;

	constructor() {
		super(studentStatusRepository, {
			byIdRoles: ['dashboard'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
			updateRoles: ['registry', 'admin'],
			deleteRoles: ['registry', 'admin'],
			activityTypes: {
				create: 'student_status_created',
				update: 'student_status_updated',
				delete: 'student_status_cancelled',
			},
		});
	}

	async get(id: number) {
		return withAuth(async () => this.repository.findById(id), ['dashboard']);
	}

	async queryAll(options: QueryOptions<typeof studentStatuses>) {
		return withAuth(
			async () => this.repository.query(options),
			['registry', 'admin']
		);
	}

	async getByStdNo(stdNo: number) {
		return withAuth(
			async () => this.repository.findByStdNo(stdNo),
			['dashboard']
		);
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

	async createStatus(data: typeof studentStatuses.$inferInsert) {
		return withAuth(
			async (session) => {
				const userId = requireSessionUserId(session);

				const student = await this.repository.findStudentByStdNo(data.stdNo);
				if (!student) throw new Error('Student not found');

				const hasPending = await this.repository.hasPending(
					data.stdNo,
					data.type as StudentStatusType
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
					if (!isEligibleByStatus && data.semesterId) {
						const semester = await this.repository.findStudentSemesterById(
							data.semesterId
						);
						isEligibleBySemester =
							semester?.status === 'Deferred' ||
							semester?.status === 'Withdrawn';
					}

					if (!isEligibleByStatus && !isEligibleBySemester)
						throw new Error('Student is not eligible for reinstatement');
				}

				const approvalRoles: StudentStatusApprovalRole[] =
					data.type === 'reinstatement'
						? ['program_leader', 'finance']
						: ['year_leader', 'program_leader', 'student_services', 'finance'];

				const baseAudit = this.buildAuditOptions(session, 'create');
				const audit: AuditOptions = {
					...(baseAudit ?? {}),
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

	async edit(id: number, data: StudentStatusEditableInput) {
		return withAuth(
			async (session) => {
				const userId = requireSessionUserId(session);
				const app = await this.repository.findById(id);
				if (!app) throw new Error('Application not found');
				if (app.status !== 'pending') {
					throw new Error('Only pending applications can be edited');
				}

				const baseAudit = this.buildAuditOptions(session, 'update');
				const audit: AuditOptions = {
					...(baseAudit ?? {}),
					userId,
					activityType: 'student_status_updated',
					stdNo: app.stdNo,
					role: session!.user!.role,
				};

				const updated = await this.repository.updateEditable(id, data, audit);
				if (!updated) {
					throw new Error('Failed to update application');
				}

				return this.repository.findById(id);
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

				const baseAudit = this.buildAuditOptions(session, 'update');
				const audit: AuditOptions = {
					...(baseAudit ?? {}),
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

				const baseAudit = this.buildAuditOptions(session, 'update');
				const audit: AuditOptions = {
					...(baseAudit ?? {}),
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

				const baseAudit = this.buildAuditOptions(session, 'update');
				const audit: AuditOptions = {
					...(baseAudit ?? {}),
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
		const userId = requireSessionUserId(session);

		if (app.type === 'withdrawal') {
			await updateStudentForStatusWorkflow(
				app.stdNo,
				'Withdrawn',
				'Withdrawal application approved'
			);

			if (app.semesterId) {
				await updateStudentSemesterForStatusWorkflow(app.semesterId, {
					status: 'Withdrawn',
					stdNo: app.stdNo,
					reasons: 'Withdrawal application approved',
				});
			}
		}

		if (app.type === 'deferment' && app.semesterId) {
			await updateStudentSemesterForStatusWorkflow(app.semesterId, {
				status: 'Deferred',
				stdNo: app.stdNo,
				reasons: 'Deferment application approved',
			});
		}

		const baseAudit = this.buildAuditOptions(session, 'update');
		const audit: AuditOptions = {
			...(baseAudit ?? {}),
			userId,
			activityType: 'student_status_approved',
			stdNo: app.stdNo,
			role: session.user!.role,
		};

		await this.repository.updateStatus(app.id, 'approved', audit);
	}
}

export const studentStatusesService = serviceWrapper(
	StudentStatusService,
	'StudentStatusService'
);
