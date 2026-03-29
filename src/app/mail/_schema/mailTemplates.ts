import { users } from '@auth/users/_schema/users';
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import type { MailTriggerType } from '../_lib/triggers';

export const mailTemplates = pgTable('mail_templates', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	triggerType: text().$type<MailTriggerType>().notNull().unique(),
	name: text().notNull(),
	subject: text().notNull(),
	body: text().notNull(),
	isActive: boolean().notNull().default(true),
	createdBy: text('created_by').references(() => users.id, {
		onDelete: 'set null',
	}),
	createdAt: timestamp().defaultNow(),
	updatedAt: timestamp()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
