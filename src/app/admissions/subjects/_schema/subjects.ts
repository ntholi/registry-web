import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const subjects = pgTable('subjects', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	isActive: boolean().notNull().default(true),
	createdAt: timestamp().defaultNow(),
	updatedAt: timestamp().defaultNow(),
});
