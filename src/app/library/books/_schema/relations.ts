import { relations } from 'drizzle-orm';
import { authors, bookCopies, categories } from '@/core/database';
import { bookAuthors } from './bookAuthors';
import { bookCategories } from './bookCategories';
import { books } from './books';

export const booksRelations = relations(books, ({ many }) => ({
	bookAuthors: many(bookAuthors),
	bookCategories: many(bookCategories),
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

export const bookCategoriesRelations = relations(bookCategories, ({ one }) => ({
	book: one(books, {
		fields: [bookCategories.bookId],
		references: [books.id],
	}),
	category: one(categories, {
		fields: [bookCategories.categoryId],
		references: [categories.id],
	}),
}));
