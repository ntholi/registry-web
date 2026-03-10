import {
	updateStudentForStatusWorkflow,
	updateStudentSemesterForStatusWorkflow,
} from '@registry/students/_server/actions';
import type { Session } from 'next-auth';
import type { studentStatuses } from '@/core/database';
import { deleteFile, uploadFile } from '@/core/integrations/storage';
import {
	generateUploadKey,
	StoragePaths,
} from '@/core/integrations/storage-utils';
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
import { ALLOWED_MIME_TYPES, MAX_ATTACHMENT_SIZE } from '../_lib/constants';
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
			findAllRoles: [
				'registry',
				'admin',
				'student_services',
				'academic',
				'finance',
			],
			createRoles: ['registry', 'admin', 'student_services'],
			updateRoles: [
				'registry',
				'admin',
				'student_services',
				'academic',
				'finance',
			],
			deleteRoles: ['registry', 'admin'],
			activityTypes: {
				create: 'student_status_created',
				update: 'student_status_updated',
				delete: 'student_status_cancelled',
			},
		});
	}

	async get(id: string) {
		return withAuth(async () => this.repository.findById(id), ['dashboard']);
	}

	async queryAll(options: QueryOptions<typeof studentStatuses>) {
		return withAuth(
			async () => this.repository.query(options),
			['registry', 'admin', 'student_services', 'academic', 'finance']
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
			['registry', 'admin', 'student_services']
		);
	}

	async uploadAttachment(
		id: string,
		file: File,
		fileName: string,
		mimeType: string
	) {
		return withAuth(
			async (session) => {
				const userId = requireSessionUserId(session);
				const app = await this.repository.findById(id);
				if (!app) throw new Error('Application not found');
				if (app.status !== 'pending') {
					throw new Error(
						`Only pending applications can accept attachments. Current status: ${app.status}`
					);
				}

				if (file.size > MAX_ATTACHMENT_SIZE) {
					throw new Error('Attachment must not exceed 5 MB');
				}

				if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
					throw new Error('Unsupported attachment type');
				}

				const key = generateUploadKey(
					(name) => StoragePaths.studentStatusAttachment(id, name),
					fileName
				);

				await uploadFile(file, key, mimeType);

				try {
					return await this.repository.createAttachment(
						{
							applicationId: id,
							fileName,
							fileKey: key,
							fileSize: file.size,
							mimeType,
						},
						{
							userId,
							role: session!.user!.role,
							activityType: 'student_status_attachment_uploaded',
							stdNo: app.stdNo,
						}
					);
				} catch (error) {
					try {
						await deleteFile(key);
					} catch (cleanupError) {
						console.error(
							'Failed to rollback student status attachment upload',
							{
								applicationId: id,
								fileKey: key,
								error: cleanupError,
							}
						);
					}
					throw error;
				}
			},
			['registry', 'admin', 'student_services']
		);
	}

	async deleteAttachment(id: string) {
		return withAuth(
			async (session) => {
				const userId = requireSessionUserId(session);
				const attachment = await this.repository.findAttachmentById(id);
				if (!attachment) {
					throw new Error('Attachment not found');
				}

				const app = await this.repository.findById(attachment.applicationId);
				if (!app) {
					throw new Error('Application not found');
				}

				if (app.status !== 'pending') {
					throw new Error(
						`Only pending applications can be updated. Current status: ${app.status}`
					);
				}

				try {
					await deleteFile(attachment.fileKey);
				} catch (error) {
					console.error('Failed to delete student status attachment file', {
						attachmentId: id,
						fileKey: attachment.fileKey,
						error,
					});
				}

				await this.repository.deleteAttachment(id, {
					userId,
					role: session!.user!.role,
					activityType: 'student_status_attachment_deleted',
					stdNo: app.stdNo,
				});

				return attachment;
			},
			['registry', 'admin', 'student_services']
		);
	}

	async edit(id: string, data: StudentStatusEditableInput) {
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

	async cancel(id: string) {
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

	async respond(
		approvalId: string,
		status: 'pending' | 'approved' | 'rejected',
		comments?: string
	) {
		return withAuth(
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
			['dashboard']
		);
	}

	private async onAllApproved(
		app: { id: string; type: string; stdNo: number; semesterId: number | null },
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
