import type { mailAccountAssignments } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import { mailAssignmentRepo } from './repository';

class MailAssignmentService extends BaseService<
	typeof mailAccountAssignments,
	'id'
> {
	constructor() {
		super(mailAssignmentRepo, {
			byIdAuth: { mails: ['read'] },
			findAllAuth: { mails: ['read'] },
			createAuth: { mails: ['create'] },
			updateAuth: { mails: ['update'] },
			deleteAuth: { mails: ['delete'] },
			activityTypes: {
				create: 'mail_assignment_created',
				delete: 'mail_assignment_removed',
			},
		});
	}

	async getAssignments(accountId: string) {
		return withPermission(
			async () => mailAssignmentRepo.findByAccountId(accountId),
			{ mails: ['read'] }
		);
	}

	async assignToRole(
		accountId: string,
		role: string,
		perms: { canCompose?: boolean; canReply?: boolean }
	) {
		return this.create({
			mailAccountId: accountId,
			role,
			canCompose: perms.canCompose ?? false,
			canReply: perms.canReply ?? true,
		});
	}

	async assignToUser(
		accountId: string,
		userId: string,
		perms: { canCompose?: boolean; canReply?: boolean }
	) {
		return this.create({
			mailAccountId: accountId,
			userId,
			canCompose: perms.canCompose ?? false,
			canReply: perms.canReply ?? true,
		});
	}

	async removeAssignment(assignmentId: number) {
		return this.delete(assignmentId);
	}

	async removeAllAssignments(accountId: string) {
		return withPermission(
			async (session) => {
				const audit = this.buildAuditOptions(session, 'delete');
				return mailAssignmentRepo.deleteByAccountId(accountId, audit);
			},
			{ mails: ['delete'] }
		);
	}
}

export const mailAssignmentService = serviceWrapper(
	MailAssignmentService,
	'MailAssignmentService'
);
