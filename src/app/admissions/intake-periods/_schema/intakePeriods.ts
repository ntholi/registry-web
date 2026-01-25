import {
	date,
	decimal,
	integer,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const intakePeriods = pgTable('intake_periods', {
	id: text()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text().notNull(),
	startDate: date({ mode: 'string' }).notNull(),
	endDate: date({ mode: 'string' }).notNull(),
	applicationFee: decimal({ precision: 10, scale: 2 }).notNull(),
	maxDocuments: integer().notNull().default(18),
	certificationValidDays: integer().notNull().default(90),
	createdAt: timestamp().defaultNow(),
	updatedAt: timestamp().defaultNow(),
});
