import { pgTable, text, unique } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { authors } from '../../authors/_schema/authors';
import { books } from './books';

export const bookAuthors = pgTable(
	'book_authors',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		bookId: text()
			.references(() => books.id, { onDelete: 'cascade' })
			.notNull(),
		authorId: text()
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
