import { sql } from 'drizzle-orm';
import {
	doublePrecision,
	index,
	integer,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const books = pgTable(
	'books',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		isbn: text().notNull().unique(),
		title: text().notNull(),
		subtitle: text(),
		summary: text(),
		price: doublePrecision(),
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
