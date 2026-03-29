import { users } from '@auth/users/_schema/users';
import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { mailAccounts } from './mailAccounts';

export const mailQueueStatus = pgEnum('mail_queue_status', [
	'pending',
	'processing',
	'sent',
	'failed',
	'retry',
]);

export const mailTriggerType = pgEnum('mail_trigger_type', [
	'student_status_created',
	'student_status_updated',
	'student_status_approved',
	'student_status_rejected',
	'notification_mirror',
	'manual',
	'reply',
	'referral_created',
	'registration_clearance_approved',
	'registration_clearance_rejected',
	'graduation_clearance_approved',
	'graduation_clearance_rejected',
]);

type Attachment = {
	filename: string;
	r2Key: string;
	mimeType: string;
};

export const mailQueue = pgTable(
	'mail_queue',
	{
		id: serial().primaryKey(),
		mailAccountId: text()
			.notNull()
			.references(() => mailAccounts.id, { onDelete: 'cascade' }),
		to: text().notNull(),
		cc: text(),
		bcc: text(),
		subject: text().notNull(),
		htmlBody: text().notNull(),
		textBody: text(),
		attachments: jsonb().$type<Attachment[]>(),
		status: mailQueueStatus().notNull().default('pending'),
		attempts: integer().notNull().default(0),
		maxAttempts: integer().notNull().default(3),
		error: text(),
		scheduledAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
		processedAt: timestamp({ mode: 'date' }),
		sentAt: timestamp({ mode: 'date' }),
		triggerType: mailTriggerType().notNull(),
		triggerEntityId: text(),
		sentByUserId: text().references(() => users.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
	},
	(table) => ({
		statusIdx: index('mail_queue_status_idx').on(
			table.status,
			table.scheduledAt
		),
		accountIdx: index('mail_queue_account_idx').on(table.mailAccountId),
		triggerIdx: index('mail_queue_trigger_idx').on(
			table.triggerType,
			table.triggerEntityId
		),
	})
);
