import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

export const terms = pgTable('terms', {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	isActive: boolean().notNull().default(false),
	semester: integer().notNull(),
	createdAt: timestamp().defaultNow(),
});
