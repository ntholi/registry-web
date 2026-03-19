import { type gmail_v1, google } from 'googleapis';
import MailComposer from 'nodemailer/lib/mail-composer';
import type { mailAccounts } from '@/core/database';
import { getFileBuffer } from '@/core/integrations/storage';
import type {
	GmailMessage,
	ReplyOptions,
	SendEmailOptions,
	SendResult,
} from '../../_lib/types';
import { mailQueueRepo } from '../../queues/_server/repository';
import { mailAccountRepo } from './repository';

type Account = typeof mailAccounts.$inferSelect;

function buildOAuth2Client(account: Account) {
	const oauth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		`${process.env.BETTER_AUTH_URL}/api/auth/gmail`
	);

	if (!account.accessToken) {
		throw new Error(`No access token for mail account ${account.email}`);
	}

	oauth2Client.setCredentials({
		access_token: account.accessToken,
		refresh_token: account.refreshToken ?? undefined,
		expiry_date: account.tokenExpiresAt
			? account.tokenExpiresAt.getTime()
			: undefined,
	});

	oauth2Client.on('tokens', async (tokens) => {
		try {
			const updates: {
				accessToken?: string;
				refreshToken?: string;
				tokenExpiresAt?: Date;
			} = {};

			if (tokens.refresh_token) {
				updates.refreshToken = tokens.refresh_token;
			}
			if (tokens.access_token) {
				updates.accessToken = tokens.access_token;
			}
			if (tokens.expiry_date) {
				updates.tokenExpiresAt = new Date(tokens.expiry_date);
			}

			if (Object.keys(updates).length > 0) {
				await mailAccountRepo.updateTokens(account.id, updates);
			}
		} catch (err) {
			console.error(
				`Failed to persist refreshed tokens for ${account.email}:`,
				err
			);
		}
	});

	return oauth2Client;
}

function buildGmailClient(account: Account): gmail_v1.Gmail {
	try {
		const auth = buildOAuth2Client(account);
		return google.gmail({ version: 'v1', auth });
	} catch (err) {
		mailAccountRepo
			.markInactive(account.id)
			.catch((e) =>
				console.error(`Failed to mark account ${account.id} inactive:`, e)
			);
		throw err;
	}
}

export async function getGmailClient(
	mailAccountId: string
): Promise<gmail_v1.Gmail> {
	const account = await mailAccountRepo.findActiveById(mailAccountId);

	if (!account) {
		throw new Error(`Mail account not found: ${mailAccountId}`);
	}

	return buildGmailClient(account);
}

export async function getGmailClientByEmail(
	email: string
): Promise<gmail_v1.Gmail> {
	const account = await mailAccountRepo.findActiveByEmail(email);

	if (!account) {
		throw new Error(`No active mail account for email: ${email}`);
	}

	return buildGmailClient(account);
}

export async function getPrimaryGmailClient(): Promise<gmail_v1.Gmail> {
	const account = await mailAccountRepo.findActivePrimary();

	if (!account) {
		throw new Error('No active primary mail account configured');
	}

	return buildGmailClient(account);
}

async function getAccountForSend(mailAccountId?: string) {
	if (mailAccountId) {
		const account = await mailAccountRepo.findActiveById(mailAccountId);
		if (!account) throw new Error(`Mail account not found: ${mailAccountId}`);
		return account;
	}
	const account = await mailAccountRepo.findActivePrimary();
	if (!account) throw new Error('No active primary mail account configured');
	return account;
}

async function buildMimeAttachments(
	attachments?: SendEmailOptions['attachments']
) {
	if (!attachments?.length) return [];
	return Promise.all(
		attachments.map(async (a) => ({
			filename: a.filename,
			content: await getFileBuffer(a.r2Key),
			contentType: a.mimeType,
		}))
	);
}

function appendSignature(html: string, signature?: string | null): string {
	if (!signature) return html;
	return `${html}<br/><br/>--<br/>${signature}`;
}

export async function sendViaGmail(
	account: Account,
	message: GmailMessage
): Promise<{ messageId: string; snippet?: string }> {
	const gmail = buildGmailClient(account);
	const htmlWithSig = appendSignature(message.htmlBody, message.signature);

	const mimeAttachments = await buildMimeAttachments(
		message.attachments?.map((a) => ({
			filename: a.filename,
			r2Key: a.r2Key,
			mimeType: a.mimeType,
		}))
	);

	const mail = new MailComposer({
		from: message.fromName
			? `${message.fromName} <${message.fromEmail}>`
			: message.fromEmail,
		to: message.to,
		cc: message.cc,
		bcc: message.bcc,
		subject: message.subject,
		html: htmlWithSig,
		text: message.textBody,
		attachments: mimeAttachments,
	});

	const compiled = await mail.compile().build();
	const raw = compiled
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

	const res = await gmail.users.messages.send({
		userId: 'me',
		requestBody: { raw },
	});

	return {
		messageId: res.data.id ?? '',
		snippet: res.data.snippet ?? undefined,
	};
}

function normalizeRecipients(value?: string | string[]): string | undefined {
	if (!value) return undefined;
	return Array.isArray(value) ? value.join(', ') : value;
}

export async function sendEmail(
	options: SendEmailOptions
): Promise<SendResult> {
	const account = await getAccountForSend(options.mailAccountId);
	const to = normalizeRecipients(options.to)!;
	const cc = normalizeRecipients(options.cc);
	const bcc = normalizeRecipients(options.bcc);

	if (options.immediate) {
		const result = await sendViaGmail(account, {
			to,
			cc,
			bcc,
			subject: options.subject,
			htmlBody: options.htmlBody,
			textBody: options.textBody,
			attachments: options.attachments,
			fromEmail: account.email,
			fromName: account.displayName ?? undefined,
			signature: account.signature ?? undefined,
		});

		try {
			await mailQueueRepo.insertSentLog({
				mailAccountId: account.id,
				gmailMessageId: result.messageId,
				to,
				cc,
				bcc,
				subject: options.subject,
				snippet: result.snippet,
				status: 'sent',
				sentByUserId: options.senderId,
				triggerType: options.triggerType,
				triggerEntityId: options.triggerEntityId,
			});
		} catch (err) {
			console.error(
				`Email sent (messageId=${result.messageId}) but failed to log:`,
				err
			);
		}

		return { queued: false, messageId: result.messageId };
	}

	await mailQueueRepo.enqueue({
		mailAccountId: account.id,
		to,
		cc,
		bcc,
		subject: options.subject,
		htmlBody: options.htmlBody,
		textBody: options.textBody,
		attachments: options.attachments,
		triggerType: options.triggerType,
		triggerEntityId: options.triggerEntityId,
		sentByUserId: options.senderId,
	});

	return { queued: true };
}

export async function sendReply(options: ReplyOptions): Promise<string> {
	const account = await mailAccountRepo.findActiveById(options.mailAccountId);
	if (!account) {
		throw new Error(`Mail account not found: ${options.mailAccountId}`);
	}

	const subject = options.subject.startsWith('Re:')
		? options.subject
		: `Re: ${options.subject}`;
	const htmlWithSig = appendSignature(options.htmlBody, account.signature);

	const gmail = buildGmailClient(account);

	const mail = new MailComposer({
		from: account.displayName
			? `${account.displayName} <${account.email}>`
			: account.email,
		to: options.to,
		subject,
		html: htmlWithSig,
		inReplyTo: options.inReplyTo,
		references: options.inReplyTo,
	});

	const compiled = await mail.compile().build();
	const raw = compiled
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

	const res = await gmail.users.messages.send({
		userId: 'me',
		requestBody: { raw, threadId: options.threadId },
	});

	const messageId = res.data.id ?? '';
	await mailQueueRepo.insertSentLog({
		mailAccountId: options.mailAccountId,
		gmailMessageId: messageId,
		to: options.to,
		subject,
		snippet: res.data.snippet ?? undefined,
		status: 'sent',
		sentByUserId: options.senderId,
		triggerType: 'reply',
	});

	return messageId;
}
