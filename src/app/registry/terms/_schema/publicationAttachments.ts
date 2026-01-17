import { users } from '@auth/users/_schema/users';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const publicationAttachments = pgTable('publication_attachments', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	termCode: text().notNull(),
	fileName: text().notNull(),
	type: text({ enum: ['scanned-pdf', 'raw-marks', 'other'] }).notNull(),
	createdAt: timestamp().defaultNow().notNull(),
	createdBy: text().references(() => users.id, { onDelete: 'set null' }),
});
