import { books } from '@library/books/_schema/books';
import { loans } from '@library/loans/_schema/loans';
import { relations } from 'drizzle-orm';
import { bookCopies } from './bookCopies';

export const bookCopiesRelations = relations(bookCopies, ({ one, many }) => ({
	book: one(books, {
		fields: [bookCopies.bookId],
		references: [books.id],
	}),
	loans: many(loans),
}));
