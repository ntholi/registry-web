import { authors } from '@library/authors/_schema/authors';
import { bookCopies } from '@library/book-copies/_schema/bookCopies';
import { relations } from 'drizzle-orm';
import { bookAuthors } from './bookAuthors';
import { books } from './books';

export const booksRelations = relations(books, ({ many }) => ({
	bookAuthors: many(bookAuthors),
	bookCopies: many(bookCopies),
}));

export const bookAuthorsRelations = relations(bookAuthors, ({ one }) => ({
	book: one(books, {
		fields: [bookAuthors.bookId],
		references: [books.id],
	}),
	author: one(authors, {
		fields: [bookAuthors.authorId],
		references: [authors.id],
	}),
}));
