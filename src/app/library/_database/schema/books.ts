import { sql } from 'drizzle-orm';
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { authors } from './authors';
import { categories } from './categories';

export const books = pgTable(
	'books',
	{
		id: serial().primaryKey(),
		isbn: text().notNull().unique(),
		title: text().notNull(),
		publisher: text(),
		publicationYear: integer(),
		edition: text(),
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

export const bookAuthors = pgTable(
	'book_authors',
	{
		id: serial().primaryKey(),
		bookId: integer()
			.references(() => books.id, { onDelete: 'cascade' })
			.notNull(),
		authorId: integer()
			.references(() => authors.id, { onDelete: 'cascade' })
			.notNull(),
	},
	(table) => ({
		bookAuthorUnique: unique('book_author_unique').on(
			table.bookId,
			table.authorId
		),
	})
);

export const bookCategories = pgTable(
	'book_categories',
	{
		id: serial().primaryKey(),
		bookId: integer()
			.references(() => books.id, { onDelete: 'cascade' })
			.notNull(),
		categoryId: integer()
			.references(() => categories.id, { onDelete: 'cascade' })
			.notNull(),
	},
	(table) => ({
		bookCategoryUnique: unique('book_category_unique').on(
			table.bookId,
			table.categoryId
		),
	})
);
