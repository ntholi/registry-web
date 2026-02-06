import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../users/_schema/users';

export const sessions = pgTable('sessions', {
	sessionToken: text().primaryKey(),
	userId: text()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expires: timestamp({ mode: 'date' }).notNull(),
});
