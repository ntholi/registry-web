'use server';

import type { mailAccounts } from '@/core/database';
import { getSession } from '@/core/platform/withPermission';
import { createAction } from '@/shared/lib/actions/actionResult';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import type { InboxOptions } from '../../_lib/types';
import { mailAssignmentRepo } from '../../assignments/_server/repository';
import {
	fetchAttachment,
	fetchInbox,
	fetchMessage,
	fetchThread,
	markAsRead,
	markAsUnread,
	sendReply,
} from './gmail-client';
import { mailAccountService } from './service';

async function requireInboxAccess(accountId: string) {
	const session = await getSession();
	if (!session?.user) throw new UserFacingError('Not authenticated', 'AUTH');

	if (session.user.role === 'admin')
		return { session, canReply: true, canCompose: true };

	const assignment = await mailAssignmentRepo.findUserAssignment(
		accountId,
		session.user.id,
		session.user.role ?? ''
	);

	if (!assignment) {
		throw new UserFacingError(
			'You do not have access to this inbox',
			'FORBIDDEN'
		);
	}

	return {
		session,
		canReply: assignment.canReply,
		canCompose: assignment.canCompose,
	};
}

export async function getMailAccounts(page = 1, search = '') {
	return mailAccountService.search({
		page,
		search,
		searchColumns: ['email', 'displayName'],
	});
}

export async function getMailAccount(id: string) {
	return mailAccountService.get(id);
}

export async function getMailAccountDetail(id: string) {
	return mailAccountService.getDetail(id);
}

export async function getMyMailAccounts() {
	const session = await getSession();
	if (!session) return [];
	return mailAccountService.getMyAccounts(session);
}

export const updateMailAccount = createAction(
	async (id: string, data: Partial<typeof mailAccounts.$inferInsert>) =>
		mailAccountService.update(id, data)
);

export const deleteMailAccount = createAction(async (id: string) =>
	mailAccountService.revokeAccount(id)
);

export const setPrimaryMailAccount = createAction(async (id: string) =>
	mailAccountService.setPrimary(id)
);

export async function getAccessibleMailAccounts() {
	return mailAccountService.getAccessibleAccounts();
}

export async function getInbox(accountId: string, options?: InboxOptions) {
	await requireInboxAccess(accountId);
	return fetchInbox(accountId, options);
}

export async function getThread(accountId: string, threadId: string) {
	await requireInboxAccess(accountId);
	return fetchThread(accountId, threadId);
}

export async function getMessage(accountId: string, messageId: string) {
	await requireInboxAccess(accountId);
	return fetchMessage(accountId, messageId);
}

export const markRead = createAction(
	async (accountId: string, messageId: string) => {
		await requireInboxAccess(accountId);
		await markAsRead(accountId, messageId);
	}
);

export const markUnread = createAction(
	async (accountId: string, messageId: string) => {
		await requireInboxAccess(accountId);
		await markAsUnread(accountId, messageId);
	}
);

export const replyToThread = createAction(
	async (accountId: string, threadId: string, htmlBody: string) => {
		const { session, canReply } = await requireInboxAccess(accountId);

		if (!canReply) {
			throw new UserFacingError(
				'You do not have permission to reply from this inbox',
				'FORBIDDEN'
			);
		}

		const thread = await fetchThread(accountId, threadId);
		const lastMsg = thread.messages[thread.messages.length - 1];
		if (!lastMsg)
			throw new UserFacingError('Thread has no messages', 'NOT_FOUND');

		const messageId = await sendReply({
			mailAccountId: accountId,
			threadId,
			inReplyTo: lastMsg.messageId,
			to: lastMsg.from.email,
			subject: lastMsg.subject,
			htmlBody,
			senderId: session.user.id,
		});

		return { messageId };
	}
);

export const downloadAttachment = createAction(
	async (accountId: string, messageId: string, attachmentId: string) => {
		await requireInboxAccess(accountId);
		const { data, size } = await fetchAttachment(
			accountId,
			messageId,
			attachmentId
		);
		return { data: data.toString('base64'), size };
	}
);
