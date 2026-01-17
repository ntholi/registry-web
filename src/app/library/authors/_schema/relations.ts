import { bookAuthors } from '@library/books/_schema/bookAuthors';
import { relations } from 'drizzle-orm';
import { authors } from './authors';

export const authorsRelations = relations(authors, ({ many }) => ({
	bookAuthors: many(bookAuthors),
}));
