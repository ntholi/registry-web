import { sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const authors = pgTable(
	'authors',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
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
