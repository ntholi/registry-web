import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from '@/modules/auth/database/schema';

export const announcementReplies = pgTable('announcement_replies', {
	id: serial().primaryKey(),
	announcementId: text().notNull(),
	courseId: text().notNull(),
	userId: text()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	text: text().notNull(),
	createdAt: timestamp().defaultNow().notNull(),
});
