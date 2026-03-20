'use server';

import { uploadFile } from '@/core/integrations/storage';
import {
	generateUploadKey,
	StoragePaths,
} from '@/core/integrations/storage-utils';
import { getSession, withPermission } from '@/core/platform/withPermission';
import { createAction } from '@/shared/lib/actions/actionResult';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import type { EmailAttachment } from '../../_lib/types';
import { mailAssignmentRepo } from '../../assignments/_server/repository';
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

export const enqueueEmail = createAction(async (formData: FormData) => {
	const session = await getSession();
	if (!session?.user) throw new UserFacingError('Not authenticated', 'AUTH');

	const mailAccountId = formData.get('mailAccountId') as string;
	const to = formData.get('to') as string;
	const cc = (formData.get('cc') as string) || undefined;
	const bcc = (formData.get('bcc') as string) || undefined;
	const subject = formData.get('subject') as string;
	const htmlBody = formData.get('htmlBody') as string;

	if (!mailAccountId || !to || !subject) {
		throw new UserFacingError('Missing required fields', 'VALIDATION');
	}

	if (session.user.role !== 'admin') {
		const assignment = await mailAssignmentRepo.findUserAssignment(
			mailAccountId,
			session.user.id,
			session.user.role ?? ''
		);
		if (!assignment?.canCompose) {
			throw new UserFacingError(
				'You do not have permission to compose from this account',
				'FORBIDDEN'
			);
		}
	}

	let attachments: EmailAttachment[] | undefined;
	const files = formData.getAll('files') as File[];
	if (files.length > 0) {
		attachments = await Promise.all(
			files
				.filter((f) => f instanceof File && f.size > 0)
				.map(async (file) => {
					const key = generateUploadKey(
						(name) => StoragePaths.mailAttachment(mailAccountId, name),
						file.name
					);
					await uploadFile(file, key);
					return {
						filename: file.name,
						r2Key: key,
						mimeType: file.type || 'application/octet-stream',
					};
				})
		);
	}

	await mailQueueRepo.enqueue({
		mailAccountId,
		to,
		cc: cc || null,
		bcc: bcc || null,
		subject,
		htmlBody,
		attachments,
		triggerType: 'manual',
		sentByUserId: session.user.id,
	});
});
