import { bigint, integer, pgTable, text } from 'drizzle-orm/pg-core';

export const rateLimits = pgTable('rate_limits', {
	id: text().primaryKey(),
	key: text().notNull().unique(),
	count: integer().notNull(),
	lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});
