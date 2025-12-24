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
	code: text().notNull().unique(),
	name: text(),
	year: integer(),
	startDate: text(),
	endDate: text(),
	isActive: boolean().notNull().default(false),
	semester: integer(),
	createdAt: timestamp().defaultNow(),
});
