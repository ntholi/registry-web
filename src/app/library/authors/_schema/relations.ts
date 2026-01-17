import { relations } from 'drizzle-orm';
import { bookAuthors } from '@/core/database';
import { authors } from './authors';

export const authorsRelations = relations(authors, ({ many }) => ({
	bookAuthors: many(bookAuthors),
}));
