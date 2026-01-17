import {
	date,
	decimal,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

export const intakePeriods = pgTable('intake_periods', {
	id: serial().primaryKey(),
	name: text().notNull(),
	startDate: date({ mode: 'string' }).notNull(),
	endDate: date({ mode: 'string' }).notNull(),
	applicationFee: decimal({ precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp().defaultNow(),
	updatedAt: timestamp().defaultNow(),
});
