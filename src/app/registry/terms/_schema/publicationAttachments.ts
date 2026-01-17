import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { users } from '@/core/database';

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
