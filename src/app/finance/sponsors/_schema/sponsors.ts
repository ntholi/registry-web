import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const sponsors = pgTable('sponsors', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	code: varchar({ length: 10 }).notNull().unique(),
	createdAt: timestamp().defaultNow(),
	updatedAt: timestamp(),
});
