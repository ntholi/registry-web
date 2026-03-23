import type { MailTriggerType } from './triggers';

export type { MailTriggerType } from './triggers';

export type EmailAttachment = {
	filename: string;
	r2Key: string;
	mimeType: string;
};

export type SendEmailOptions = {
	to: string | string[];
	cc?: string | string[];
	bcc?: string | string[];
	subject: string;
	htmlBody: string;
	textBody?: string;
	attachments?: EmailAttachment[];
	triggerType: MailTriggerType;
	triggerEntityId?: string;
	mailAccountId?: string;
	senderId?: string;
	immediate?: boolean;
};

export type SendResult = {
	queued: boolean;
	messageId?: string;
};

export type GmailMessage = {
	to: string;
	cc?: string;
	bcc?: string;
	subject: string;
	htmlBody: string;
	textBody?: string;
	attachments?: EmailAttachment[];
	fromEmail: string;
	fromName?: string;
	signature?: string;
};

export type ReplyOptions = {
	mailAccountId: string;
	threadId: string;
	inReplyTo: string;
	to: string;
	subject: string;
	htmlBody: string;
	senderId: string;
};

export type ProcessResult = {
	processed: number;
	sent: number;
	failed: number;
	retried: number;
};

export type InboxOptions = {
	maxResults?: number;
	pageToken?: string;
	query?: string;
	labelIds?: string[];
};

export type MessageAttachment = {
	attachmentId: string;
	filename: string;
	mimeType: string;
	size: number;
};

export type InboxThread = {
	threadId: string;
	subject: string;
	snippet: string;
	from: { name: string; email: string };
	to: string;
	messageCount: number;
	isRead: boolean;
	hasAttachments: boolean;
	lastMessageAt: Date;
};

export type ThreadMessage = {
	messageId: string;
	from: { name: string; email: string };
	to: string;
	cc: string;
	subject: string;
	htmlBody: string;
	textBody: string;
	isRead: boolean;
	receivedAt: Date;
	attachments: MessageAttachment[];
};

export type InboxResult = {
	threads: InboxThread[];
	nextPageToken?: string;
	resultSizeEstimate?: number;
};

export type AccessibleAccount = {
	id: string;
	email: string;
	displayName: string | null;
	isPrimary: boolean;
	isActive: boolean;
	canCompose?: boolean;
	canReply?: boolean;
};
