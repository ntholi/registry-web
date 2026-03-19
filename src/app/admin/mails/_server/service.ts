import { google } from 'googleapis';
import type { Session } from '@/core/auth';
import type { mailAccounts } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import { mailAccountRepo, mailAssignmentRepo } from './repository';

class MailAccountService extends BaseService<typeof mailAccounts, 'id'> {
	constructor() {
		super(mailAccountRepo, {
			byIdAuth: { mails: ['read'] },
			findAllAuth: { mails: ['read'] },
			createAuth: 'auth',
			updateAuth: { mails: ['update'] },
			deleteAuth: 'auth',
			activityTypes: {
				create: 'mail_account_authorized',
				update: 'mail_account_updated',
				delete: 'mail_account_revoked',
			},
		});
	}

	async search(params: QueryOptions<typeof mailAccounts>) {
		return withPermission(async () => mailAccountRepo.search(params), {
			mails: ['read'],
		});
	}

	async getMyAccounts(session: Session) {
		const userId = session.user.id;
		return mailAccountRepo.findByUserId(userId);
	}

	async setPrimary(id: string) {
		return withPermission(
			async (session) => {
				const audit = this.buildAuditOptions(session, 'update');
				return mailAccountRepo.setPrimary(id, audit);
			},
			{ mails: ['update'] }
		);
	}

	async getAccessibleAccounts() {
		return withPermission(async (session) => {
			if (!session?.user) return [];
			if (session.user.role === 'admin') {
				return mailAccountRepo.findActive();
			}
			return mailAssignmentRepo.findAccessibleAccounts(
				session.user.id,
				session.user.role ?? ''
			);
		}, 'dashboard');
	}

	async revokeAccount(id: string) {
		return withPermission(async (session) => {
			if (!session?.user) throw new Error('Not authenticated');

			const account = await mailAccountRepo.findById(id);
			if (!account) throw new Error('Mail account not found');

			const isOwner = account.userId === session.user.id;
			const isAdmin = session.user.role === 'admin';
			if (!isOwner && !isAdmin) {
				throw new Error('You do not have permission to revoke this email');
			}

			if (account.accessToken) {
				try {
					const oauth2Client = new google.auth.OAuth2();
					await oauth2Client.revokeToken(account.accessToken);
				} catch {
					// Best-effort token revocation
				}
			}

			const audit = this.buildAuditOptions(session, 'delete');
			await mailAccountRepo.revokeAccount(id, audit);
		}, 'auth');
	}
}

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

export const mailAccountService = serviceWrapper(
	MailAccountService,
	'MailAccountService'
);
export const mailAssignmentService = serviceWrapper(
	MailAssignmentService,
	'MailAssignmentService'
);
