import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const verifications = pgTable('verifications', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date()),
});
