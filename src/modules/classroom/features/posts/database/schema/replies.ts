import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from '@/modules/auth/database/schema/users';
import { coursePosts } from './posts';

export const postReplies = pgTable('post_replies', {
	id: serial().primaryKey(),
	postId: integer()
		.notNull()
		.references(() => coursePosts.id, { onDelete: 'cascade' }),
	userId: text()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	content: text().notNull(),
	createdAt: timestamp().defaultNow().notNull(),
	updatedAt: timestamp().defaultNow().notNull(),
});
