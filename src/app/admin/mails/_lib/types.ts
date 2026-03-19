import type { mailTriggerType } from '../_schema/mailQueue';

export type MailTriggerType = (typeof mailTriggerType.enumValues)[number];

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
