import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const letterSerialCounters = pgTable('letter_serial_counters', {
	datePrefix: text('date_prefix').primaryKey(),
	counter: integer().notNull().default(0),
});
