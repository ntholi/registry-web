import { studentsService } from '@registry/students/_server/service';
import type { Session } from '@/core/auth';
import type { studentStatuses } from '@/core/database';
import type {
	AuditOptions,
	QueryOptions,
} from '@/core/platform/BaseRepository';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import {
	requireSessionUserId,
	withPermission,
} from '@/core/platform/withPermission';
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
			byIdAuth: { 'student-statuses': ['read'] },
			findAllAuth: { 'student-statuses': ['read'] },
			createAuth: { 'student-statuses': ['create'] },
			updateAuth: { 'student-statuses': ['update'] },
			deleteAuth: { 'student-statuses': ['delete'] },
			activityTypes: {
				create: 'student_status_created',
				update: 'student_status_updated',
				delete: 'student_status_cancelled',
			},
		});
	}

	async get(id: string) {
		return withPermission(async () => this.repository.findById(id), {
			'student-statuses': ['read'],
		});
	}

	async queryAll(options: QueryOptions<typeof studentStatuses>) {
		return withPermission(async () => this.repository.query(options), {
			'student-statuses': ['read'],
		});
	}

	async getByStdNo(stdNo: number) {
		return withPermission(async () => this.repository.findByStdNo(stdNo), {
			'student-statuses': ['read'],
		});
	}

	async getPendingForApproval(options: QueryOptions<typeof studentStatuses>) {
		return withPermission(
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
		return withPermission(
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
		return withPermission(
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

				const approvalRoles: StudentStatusApprovalRole[] = [];
				if (data.type === 'reinstatement') {
					approvalRoles.push('program_leader', 'finance');
				} else {
					approvalRoles.push(
						'year_leader',
						'program_leader',
						'student_services',
						'finance'
					);
				}

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
			{ 'student-statuses': ['create'] }
		);
	}

	async edit(id: string, data: StudentStatusEditableInput) {
		return withPermission(
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
			{ 'student-statuses': ['update'] }
		);
	}

	async cancel(id: string) {
		return withPermission(
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
			{ 'student-statuses': ['delete'] }
		);
	}

	async respond(
		approvalId: string,
		status: 'pending' | 'approved' | 'rejected',
		comments?: string
	) {
		return withPermission(
			async (session) => {
				const userId = requireSessionUserId(session);

				const approval = await this.repository.findApprovalById(approvalId);
				if (!approval) throw new Error('Approval step not found');
				if (!canUserApproveRole(session!, approval.approverRole))
					throw new Error('Unauthorized for this approval step');

				const app = approval.application;
				if (app.status === 'approved')
					throw new Error('Application is already approved');

				const baseAudit = this.buildAuditOptions(session, 'update');
				const activityType =
					status === 'approved'
						? 'student_status_approved'
						: status === 'rejected'
							? 'student_status_rejected'
							: 'student_status_updated';

				const audit: AuditOptions = {
					...(baseAudit ?? {}),
					userId,
					activityType,
					stdNo: app.stdNo,
					role: session!.user!.role,
				};

				await this.repository.respondToApproval(
					approvalId,
					{ status, respondedBy: userId, comments },
					audit
				);

				if (status === 'approved') {
					const allApprovals = await this.repository.getApprovalsByAppId(
						app.id
					);
					const allApproved = allApprovals.every(
						(a) => a.status === 'approved'
					);

					if (allApproved) {
						await this.onAllApproved(app, session!);
					}
				}

				return this.repository.findById(app.id);
			},
			{ 'student-statuses': ['update'] }
		);
	}

	private async onAllApproved(
		app: { id: string; type: string; stdNo: number; semesterId: number | null },
		session: Session
	) {
		const userId = requireSessionUserId(session);

		if (app.type === 'withdrawal') {
			await studentsService.updateForStatusWorkflow(
				app.stdNo,
				'Withdrawn',
				'Withdrawal application approved'
			);

			if (app.semesterId) {
				await studentsService.updateStudentSemesterForStatusWorkflow(
					app.semesterId,
					'Withdrawn',
					app.stdNo,
					'Withdrawal application approved'
				);
			}
		}

		if (app.type === 'deferment' && app.semesterId) {
			await studentsService.updateStudentSemesterForStatusWorkflow(
				app.semesterId,
				'Deferred',
				app.stdNo,
				'Deferment application approved'
			);
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
