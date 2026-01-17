import { integer, pgTable, serial, unique } from 'drizzle-orm/pg-core';
import { authors } from '../../authors/_schema/authors';
import { books } from './books';

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
