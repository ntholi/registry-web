import { boolean, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { mailTriggerType } from './mailQueue';

export const mailTriggerSettings = pgTable('mail_trigger_settings', {
	triggerType: mailTriggerType().primaryKey(),
	enabled: boolean().notNull().default(true),
	updatedAt: timestamp({ mode: 'date' })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});
