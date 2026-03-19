'use server';

import { withPermission } from '@/core/platform/withPermission';
import { createAction } from '@/shared/lib/actions/actionResult';
import { mailQueueRepo } from './repository';

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
