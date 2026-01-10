import { sql } from 'drizzle-orm';
import { index, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const authors = pgTable(
	'authors',
	{
		id: serial().primaryKey(),
		name: text().notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		nameTrigramIdx: index('idx_authors_name_trgm').using(
			'gin',
			sql`${table.name} gin_trgm_ops`
		),
	})
);
