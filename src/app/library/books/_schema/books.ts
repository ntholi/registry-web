import { sql } from 'drizzle-orm';
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

export const books = pgTable(
	'books',
	{
		id: serial().primaryKey(),
		isbn: text().notNull().unique(),
		title: text().notNull(),
		subtitle: text(),
		description: text(),
		publisher: text(),
		publicationYear: integer(),
		coverUrl: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		titleTrigramIdx: index('idx_books_title_trgm').using(
			'gin',
			sql`${table.title} gin_trgm_ops`
		),
		isbnIdx: index('idx_books_isbn').on(table.isbn),
	})
);
