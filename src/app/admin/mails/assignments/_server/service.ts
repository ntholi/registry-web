import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import { mailAssignmentRepo } from './repository';

class MailAssignmentService {
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
		return withPermission(
			async (session) => {
				const audit = session?.user?.id
					? {
							userId: session.user.id,
							activityType: 'mail_assignment_created',
							role: session.user.role ?? undefined,
						}
					: undefined;
				return mailAssignmentRepo.create(
					{
						mailAccountId: accountId,
						role,
						canCompose: perms.canCompose ?? false,
						canReply: perms.canReply ?? true,
					},
					audit
				);
			},
			{ mails: ['create'] }
		);
	}

	async assignToUser(
		accountId: string,
		userId: string,
		perms: { canCompose?: boolean; canReply?: boolean }
	) {
		return withPermission(
			async (session) => {
				const audit = session?.user?.id
					? {
							userId: session.user.id,
							activityType: 'mail_assignment_created',
							role: session.user.role ?? undefined,
						}
					: undefined;
				return mailAssignmentRepo.create(
					{
						mailAccountId: accountId,
						userId,
						canCompose: perms.canCompose ?? false,
						canReply: perms.canReply ?? true,
					},
					audit
				);
			},
			{ mails: ['create'] }
		);
	}

	async removeAssignment(assignmentId: number) {
		return withPermission(
			async (session) => {
				const audit = session?.user?.id
					? {
							userId: session.user.id,
							activityType: 'mail_assignment_removed',
							role: session.user.role ?? undefined,
						}
					: undefined;
				return mailAssignmentRepo.delete(assignmentId, audit);
			},
			{ mails: ['delete'] }
		);
	}

	async removeAllAssignments(accountId: string) {
		return withPermission(
			async (session) => {
				const audit = session?.user?.id
					? {
							userId: session.user.id,
							activityType: 'mail_assignment_removed',
							role: session.user.role ?? undefined,
						}
					: undefined;
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
