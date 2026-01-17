import { relations } from 'drizzle-orm';
import { books, loans } from '@/core/database';
import { bookCopies } from './bookCopies';

export const bookCopiesRelations = relations(bookCopies, ({ one, many }) => ({
	book: one(books, {
		fields: [bookCopies.bookId],
		references: [books.id],
	}),
	loans: many(loans),
}));
