import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const externalLibraries = pgTable('external_libraries', {
	id: serial().primaryKey(),
	name: text().notNull(),
	url: text().notNull(),
	username: text(),
	password: text(),
	description: text(),
	createdAt: timestamp().defaultNow(),
});
