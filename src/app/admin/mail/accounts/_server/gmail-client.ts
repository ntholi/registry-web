import { type gmail_v1, google } from 'googleapis';
import MailComposer from 'nodemailer/lib/mail-composer';
import sanitize from 'sanitize-html';
import type { mailAccounts } from '@/core/database';
import { getFileBuffer } from '@/core/integrations/storage';
import type {
	GmailMessage,
	InboxOptions,
	InboxResult,
	InboxThread,
	MessageAttachment,
	ReplyOptions,
	SendEmailOptions,
	SendResult,
	ThreadMessage,
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

type GmailPart = gmail_v1.Schema$MessagePart;
type GmailHeader = gmail_v1.Schema$MessagePartHeader;

const sanitizeOptions: sanitize.IOptions = {
	allowedTags: [
		'p',
		'br',
		'div',
		'span',
		'a',
		'img',
		'table',
		'thead',
		'tbody',
		'tr',
		'td',
		'th',
		'ul',
		'ol',
		'li',
		'b',
		'i',
		'strong',
		'em',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'blockquote',
		'pre',
		'code',
		'hr',
	],
	allowedAttributes: {
		a: ['href', 'target', 'rel'],
		img: ['src', 'alt', 'width', 'height'],
		td: ['colspan', 'rowspan', 'style'],
		th: ['colspan', 'rowspan', 'style'],
		div: ['style'],
		span: ['style'],
		p: ['style'],
		table: ['style', 'width', 'cellpadding', 'cellspacing', 'border'],
		tr: ['style'],
	},
	allowedSchemesByTag: {
		a: ['http', 'https', 'mailto'],
		img: ['http', 'https', 'cid'],
	},
};

function getHeader(headers: GmailHeader[] | undefined, name: string): string {
	if (!headers) return '';
	const h = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
	return h?.value ?? '';
}

function parseEmailAddress(raw: string): { name: string; email: string } {
	const match = raw.match(/^(.+?)\s*<(.+?)>$/);
	if (match)
		return {
			name: match[1].trim().replace(/^"|"$/g, ''),
			email: match[2],
		};
	return { name: '', email: raw.trim() };
}

function findBodyPart(
	parts: GmailPart[] | undefined,
	mimeType: string
): string {
	if (!parts) return '';
	for (const part of parts) {
		if (part.mimeType === mimeType && part.body?.data) {
			return Buffer.from(part.body.data, 'base64url').toString('utf-8');
		}
		if (part.parts) {
			const found = findBodyPart(part.parts, mimeType);
			if (found) return found;
		}
	}
	return '';
}

function extractBody(payload: GmailPart | undefined): {
	html: string;
	text: string;
} {
	if (!payload) return { html: '', text: '' };

	if (payload.body?.data) {
		const decoded = Buffer.from(payload.body.data, 'base64url').toString(
			'utf-8'
		);
		if (payload.mimeType === 'text/html') return { html: decoded, text: '' };
		if (payload.mimeType === 'text/plain') return { html: '', text: decoded };
	}

	const html = findBodyPart(payload.parts, 'text/html');
	const text = findBodyPart(payload.parts, 'text/plain');
	return { html, text };
}

function extractAttachments(
	parts: GmailPart[] | undefined
): MessageAttachment[] {
	if (!parts) return [];
	const result: MessageAttachment[] = [];
	for (const part of parts) {
		if (part.filename && part.body?.attachmentId) {
			result.push({
				attachmentId: part.body.attachmentId,
				filename: part.filename,
				mimeType: part.mimeType ?? 'application/octet-stream',
				size: part.body.size ?? 0,
			});
		}
		if (part.parts) {
			result.push(...extractAttachments(part.parts));
		}
	}
	return result;
}

function hasAnyAttachment(parts: GmailPart[] | undefined): boolean {
	if (!parts) return false;
	for (const part of parts) {
		if (part.filename) return true;
		if (part.parts && hasAnyAttachment(part.parts)) return true;
	}
	return false;
}

function parseMessage(msg: gmail_v1.Schema$Message): ThreadMessage {
	const headers = msg.payload?.headers;
	const from = parseEmailAddress(getHeader(headers, 'From'));
	const { html, text } = extractBody(msg.payload);

	return {
		messageId: msg.id ?? '',
		from,
		to: getHeader(headers, 'To'),
		cc: getHeader(headers, 'Cc'),
		subject: getHeader(headers, 'Subject') || '(No Subject)',
		htmlBody: sanitize(html, sanitizeOptions),
		textBody: text,
		isRead: !msg.labelIds?.includes('UNREAD'),
		receivedAt: msg.internalDate
			? new Date(Number(msg.internalDate))
			: new Date(),
		attachments: extractAttachments(msg.payload?.parts),
	};
}

export async function fetchInbox(
	mailAccountId: string,
	options: InboxOptions = {}
): Promise<InboxResult> {
	const gmail = await getGmailClient(mailAccountId);
	const { maxResults = 20, pageToken, query, labelIds = ['INBOX'] } = options;

	const listRes = await gmail.users.threads.list({
		userId: 'me',
		maxResults,
		pageToken: pageToken ?? undefined,
		q: query ?? undefined,
		labelIds,
	});

	const rawThreads = listRes.data.threads ?? [];
	if (rawThreads.length === 0) {
		return { threads: [], nextPageToken: undefined, resultSizeEstimate: 0 };
	}

	const threadDetails = await Promise.all(
		rawThreads.map(async (t) => {
			const res = await gmail.users.threads.get({
				userId: 'me',
				id: t.id!,
				format: 'metadata',
				metadataHeaders: ['From', 'To', 'Subject', 'Date'],
			});
			return res.data;
		})
	);

	const threads: InboxThread[] = threadDetails.map((thread) => {
		const messages = thread.messages ?? [];
		const firstMsg = messages[0];
		const lastMsg = messages[messages.length - 1];
		const firstHeaders = firstMsg?.payload?.headers;
		const lastHeaders = lastMsg?.payload?.headers;

		const from = parseEmailAddress(getHeader(lastHeaders, 'From'));
		const subject = getHeader(firstHeaders, 'Subject') || '(No Subject)';
		const to = getHeader(lastHeaders, 'To');
		const dateStr = getHeader(lastHeaders, 'Date');

		const isRead = messages.every((m) => !m.labelIds?.includes('UNREAD'));
		const hasAttachments = messages.some((m) =>
			hasAnyAttachment(m.payload?.parts)
		);

		return {
			threadId: thread.id ?? '',
			subject,
			snippet: thread.snippet ?? '',
			from,
			to,
			messageCount: messages.length,
			isRead,
			hasAttachments,
			lastMessageAt: dateStr ? new Date(dateStr) : new Date(),
		};
	});

	return {
		threads,
		nextPageToken: listRes.data.nextPageToken ?? undefined,
		resultSizeEstimate: listRes.data.resultSizeEstimate ?? undefined,
	};
}

export async function fetchThread(
	mailAccountId: string,
	threadId: string
): Promise<{ threadId: string; messages: ThreadMessage[] }> {
	const gmail = await getGmailClient(mailAccountId);

	const res = await gmail.users.threads.get({
		userId: 'me',
		id: threadId,
		format: 'full',
	});

	const messages = (res.data.messages ?? []).map(parseMessage);

	return { threadId: res.data.id ?? threadId, messages };
}

export async function fetchMessage(
	mailAccountId: string,
	messageId: string
): Promise<ThreadMessage> {
	const gmail = await getGmailClient(mailAccountId);

	const res = await gmail.users.messages.get({
		userId: 'me',
		id: messageId,
		format: 'full',
	});

	return parseMessage(res.data);
}

export async function markAsRead(
	mailAccountId: string,
	messageId: string
): Promise<void> {
	const gmail = await getGmailClient(mailAccountId);
	await gmail.users.messages.modify({
		userId: 'me',
		id: messageId,
		requestBody: { removeLabelIds: ['UNREAD'] },
	});
}

export async function markAsUnread(
	mailAccountId: string,
	messageId: string
): Promise<void> {
	const gmail = await getGmailClient(mailAccountId);
	await gmail.users.messages.modify({
		userId: 'me',
		id: messageId,
		requestBody: { addLabelIds: ['UNREAD'] },
	});
}

export async function fetchAttachment(
	mailAccountId: string,
	messageId: string,
	attachmentId: string
): Promise<{ data: Buffer; size: number }> {
	const gmail = await getGmailClient(mailAccountId);

	const res = await gmail.users.messages.attachments.get({
		userId: 'me',
		messageId,
		id: attachmentId,
	});

	const data = Buffer.from(res.data.data ?? '', 'base64url');
	return { data, size: res.data.size ?? data.length };
}
