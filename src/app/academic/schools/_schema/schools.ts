import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

export const schools = pgTable('schools', {
	id: serial().primaryKey(),
	cmsId: integer().unique(),
	code: text().notNull().unique(),
	name: text().notNull(),
	shortName: text(),
	isActive: boolean().notNull().default(true),
	createdAt: timestamp().defaultNow(),
});
