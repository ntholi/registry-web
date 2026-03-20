'use server';

import { z } from 'zod/v4';
import { uploadFile } from '@/core/integrations/storage';
import {
	generateUploadKey,
	StoragePaths,
} from '@/core/integrations/storage-utils';
import { getSession, withPermission } from '@/core/platform/withPermission';
import { createAction } from '@/shared/lib/actions/actionResult';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import type { EmailAttachment } from '../../_lib/types';
import { sendEmail } from '../../accounts/_server/gmail-client';
import { mailAssignmentRepo } from '../../assignments/_server/repository';
import { mailQueueRepo } from './repository';

const enqueueSchema = z.object({
	mailAccountId: z.string().min(1),
	to: z.string().min(1),
	cc: z.string().optional(),
	bcc: z.string().optional(),
	subject: z.string().min(1),
	htmlBody: z.string().min(1),
});

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
	return withPermission(
		async (session) => {
			const audit = session?.user
				? {
						userId: session.user.id,
						role: session.user.role ?? undefined,
						activityType: 'mail_queue_retried',
					}
				: undefined;
			return mailQueueRepo.resetToRetry(queueId, audit);
		},
		{ mails: ['update'] }
	);
});

export const cancelQueuedEmail = createAction(async (queueId: number) => {
	return withPermission(
		async (session) => {
			const audit = session?.user
				? {
						userId: session.user.id,
						role: session.user.role ?? undefined,
						activityType: 'mail_queue_cancelled',
					}
				: undefined;
			return mailQueueRepo.cancelQueued(queueId, audit);
		},
		{ mails: ['delete'] }
	);
});

export async function getSentLogEntry(id: number) {
	return withPermission(async () => mailQueueRepo.getSentLogEntry(id), {
		mails: ['read'],
	});
}

export async function getQueueItem(id: number) {
	return withPermission(async () => mailQueueRepo.getQueueItem(id), {
		mails: ['read'],
	});
}

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

	const parsed = enqueueSchema.safeParse({
		mailAccountId: formData.get('mailAccountId'),
		to: formData.get('to'),
		cc: formData.get('cc') || undefined,
		bcc: formData.get('bcc') || undefined,
		subject: formData.get('subject'),
		htmlBody: formData.get('htmlBody'),
	});

	if (!parsed.success) {
		throw new UserFacingError('Missing required fields', 'VALIDATION');
	}

	const { mailAccountId, to, cc, bcc, subject, htmlBody } = parsed.data;

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
export const sendEmailDirect = createAction(async (formData: FormData) => {
	const session = await getSession();
	if (!session?.user) throw new UserFacingError('Not authenticated', 'AUTH');
	if (session.user.role !== 'admin')
		throw new UserFacingError('Admin access required', 'FORBIDDEN');

	const parsed = enqueueSchema.safeParse({
		mailAccountId: formData.get('mailAccountId'),
		to: formData.get('to'),
		cc: formData.get('cc') || undefined,
		bcc: formData.get('bcc') || undefined,
		subject: formData.get('subject'),
		htmlBody: formData.get('htmlBody'),
	});

	if (!parsed.success)
		throw new UserFacingError('Missing required fields', 'VALIDATION');

	const { mailAccountId, to, cc, bcc, subject, htmlBody } = parsed.data;

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

	await sendEmail({
		mailAccountId,
		to,
		cc,
		bcc,
		subject,
		htmlBody,
		attachments,
		triggerType: 'manual',
		senderId: session.user.id,
		immediate: true,
	});
});
