import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const externalLibraries = pgTable('external_libraries', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text().notNull(),
	url: text().notNull(),
	username: text(),
	password: text(),
	description: text(),
	createdAt: timestamp().defaultNow(),
});
