import { google } from 'googleapis';
import type { Session } from '@/core/auth';
import type { mailAccounts } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import { mailAssignmentRepo } from '../../assignments/_server/repository';
import { mailAccountRepo } from './repository';

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

export const mailAccountService = serviceWrapper(
	MailAccountService,
	'MailAccountService'
);
