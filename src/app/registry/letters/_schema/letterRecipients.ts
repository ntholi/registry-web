import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { letterTemplates } from './letterTemplates';

export const letterRecipients = pgTable('letter_recipients', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	templateId: text('template_id')
		.references(() => letterTemplates.id, { onDelete: 'cascade' })
		.notNull(),
	title: text().notNull(),
	org: text().notNull(),
	address: text(),
	city: text(),
	popularity: integer().notNull().default(0),
	createdAt: timestamp().defaultNow(),
});
