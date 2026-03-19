'use server';

import type { mailAccounts } from '@/core/database';
import { getSession, withPermission } from '@/core/platform/withPermission';
import { createAction } from '@/shared/lib/actions/actionResult';
import { mailQueueRepo } from './repository';
import { mailAccountService, mailAssignmentService } from './service';

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

export async function getAssignments(accountId: string) {
	return mailAssignmentService.getAssignments(accountId);
}

export const assignToRole = createAction(
	async (
		accountId: string,
		role: string,
		perms: { canCompose?: boolean; canReply?: boolean }
	) => mailAssignmentService.assignToRole(accountId, role, perms)
);

export const assignToUser = createAction(
	async (
		accountId: string,
		userId: string,
		perms: { canCompose?: boolean; canReply?: boolean }
	) => mailAssignmentService.assignToUser(accountId, userId, perms)
);

export const removeAssignment = createAction(async (assignmentId: number) =>
	mailAssignmentService.removeAssignment(assignmentId)
);

export async function getAccessibleMailAccounts() {
	return mailAccountService.getAccessibleAccounts();
}

export { getMyMailAccounts as getUserMailAccounts };
export { deleteMailAccount as revokeMailAccount };

export async function getQueueStatus() {
	return withPermission(async () => mailQueueRepo.getQueueCounts(), {
		mails: ['read'],
	});
}

export async function getQueueItems(page = 1, status?: string) {
	return withPermission(async () => mailQueueRepo.getQueueItems(page, status), {
		mails: ['read'],
	});
}

export const retryFailedEmail = createAction(async (queueId: number) => {
	return withPermission(async () => mailQueueRepo.resetToRetry(queueId), {
		mails: ['update'],
	});
});

export const cancelQueuedEmail = createAction(async (queueId: number) => {
	return withPermission(async () => mailQueueRepo.cancelQueued(queueId), {
		mails: ['delete'],
	});
});

export async function getSentLog(page = 1, search = '') {
	return withPermission(
		async () => mailQueueRepo.getSentLog(page, search || undefined),
		{ mails: ['read'] }
	);
}

export async function getDailyStats(accountId: string) {
	return withPermission(
		async () => mailQueueRepo.getDailyStatsForAccount(accountId),
		{ mails: ['read'] }
	);
}
