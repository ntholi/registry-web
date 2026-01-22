import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	description: text(),
	createdAt: timestamp().defaultNow(),
});
