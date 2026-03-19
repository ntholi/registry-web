import type { ProcessResult } from '../_lib/types';
import { sendViaGmail } from './gmail-client';
import { mailAccountRepo, mailQueueRepo } from './repository';

const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 3;

const BACKOFF_DELAYS = [60_000, 300_000] as const;

function getBackoffDelay(attempt: number): number {
	if (attempt <= BACKOFF_DELAYS.length) {
		return BACKOFF_DELAYS[attempt - 1];
	}
	return -1;
}

function isRetriable(err: unknown): boolean {
	if (err instanceof Error && 'code' in err) {
		const code = (err as { code: number }).code;
		return code === 429 || code >= 500;
	}
	if (err instanceof Error && 'status' in err) {
		const status = (err as { status: number }).status;
		return status === 429 || status >= 500;
	}
	if (err instanceof Error && err.message.includes('ECONNREFUSED')) {
		return true;
	}
	return false;
}

export async function processEmailQueue(): Promise<ProcessResult> {
	const result: ProcessResult = {
		processed: 0,
		sent: 0,
		failed: 0,
		retried: 0,
	};

	const batch = await mailQueueRepo.claimBatch(BATCH_SIZE);
	if (batch.length === 0) return result;

	const accountIds = [...new Set(batch.map((r) => r.mailAccountId))];
	const [dailyCounts, accounts] = await Promise.all([
		mailQueueRepo.getDailySendCounts(accountIds),
		mailAccountRepo.findByIds(accountIds),
	]);

	const accountMap = new Map(accounts.map((a) => [a.id, a]));
	const dailyLimit = Number(process.env.MAIL_DAILY_LIMIT) || 1900;

	const rateLimitedIds: number[] = [];
	const sendable: typeof batch = [];

	for (const row of batch) {
		const sent = dailyCounts.get(row.mailAccountId) ?? 0;
		if (sent >= dailyLimit) {
			rateLimitedIds.push(row.id);
		} else {
			sendable.push(row);
			dailyCounts.set(row.mailAccountId, sent + 1);
		}
	}

	if (rateLimitedIds.length > 0) {
		const retryAt = new Date(Date.now() + 600_000);
		await mailQueueRepo.markBatchRetry(
			rateLimitedIds,
			'Daily send limit reached',
			retryAt
		);
		result.retried += rateLimitedIds.length;
	}

	for (const row of sendable) {
		result.processed++;
		const account = accountMap.get(row.mailAccountId);

		if (!account) {
			await mailQueueRepo.markFailed(
				row.id,
				`Mail account ${row.mailAccountId} not found`
			);
			result.failed++;
			continue;
		}

		try {
			const sendResult = await sendViaGmail(row.mailAccountId, {
				to: row.to,
				cc: row.cc ?? undefined,
				bcc: row.bcc ?? undefined,
				subject: row.subject,
				htmlBody: row.htmlBody,
				textBody: row.textBody ?? undefined,
				attachments: row.attachments ?? undefined,
				fromEmail: account.email,
				fromName: account.displayName ?? undefined,
				signature: account.signature ?? undefined,
			});

			await mailQueueRepo.markSent(row.id, sendResult.messageId, row);
			result.sent++;
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Unknown error';

			if (!isRetriable(err) || row.attempts >= MAX_ATTEMPTS) {
				await mailQueueRepo.markFailed(row.id, errorMsg);
				result.failed++;
			} else {
				const delay = getBackoffDelay(row.attempts);
				if (delay < 0) {
					await mailQueueRepo.markFailed(row.id, errorMsg);
					result.failed++;
				} else {
					await mailQueueRepo.markRetry(
						row.id,
						errorMsg,
						new Date(Date.now() + delay)
					);
					result.retried++;
				}
			}
		}
	}

	return result;
}
