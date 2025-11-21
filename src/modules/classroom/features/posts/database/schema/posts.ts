import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from '@/modules/auth/database/schema/users';

export const coursePosts = pgTable('course_posts', {
	id: serial().primaryKey(),
	courseId: text().notNull(),
	userId: text()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	content: text().notNull(),
	createdAt: timestamp().defaultNow().notNull(),
	updatedAt: timestamp().defaultNow().notNull(),
});
