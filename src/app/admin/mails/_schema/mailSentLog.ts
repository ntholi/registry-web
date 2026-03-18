import { users } from '@auth/users/_schema/users';
import { sql } from 'drizzle-orm';
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { mailAccounts } from './mailAccounts';
import { mailQueue, mailTriggerType } from './mailQueue';

export const mailSentLog = pgTable(
	'mail_sent_log',
	{
		id: serial().primaryKey(),
		mailAccountId: text()
			.notNull()
			.references(() => mailAccounts.id, { onDelete: 'cascade' }),
		queueId: integer().references(() => mailQueue.id, {
			onDelete: 'set null',
		}),
		gmailMessageId: text(),
		to: text().notNull(),
		cc: text(),
		bcc: text(),
		subject: text().notNull(),
		snippet: text(),
		status: text().notNull(),
		error: text(),
		sentAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
		sentByUserId: text().references(() => users.id, {
			onDelete: 'set null',
		}),
		triggerType: mailTriggerType().notNull(),
		triggerEntityId: text(),
	},
	(table) => ({
		accountIdx: index('mail_sent_log_account_idx').on(table.mailAccountId),
		sentAtIdx: index('mail_sent_log_sent_at_idx').on(sql`${table.sentAt} DESC`),
		triggerIdx: index('mail_sent_log_trigger_idx').on(
			table.triggerType,
			table.triggerEntityId
		),
	})
);
