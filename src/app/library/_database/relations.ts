import { users } from '@auth/_database';
import { paymentReceipts } from '@finance/_database';
import { students } from '@registry/_database';
import { relations } from 'drizzle-orm';
import { authors } from './schema/authors';
import { bookCopies } from './schema/book-copies';
import { bookAuthors, bookCategories, books } from './schema/books';
import { categories } from './schema/categories';
import { fines } from './schema/fines';
import { loanRenewals, loans } from './schema/loans';
import { digitalResources } from './schema/resources';

export const booksRelations = relations(books, ({ many }) => ({
	bookAuthors: many(bookAuthors),
	bookCategories: many(bookCategories),
	bookCopies: many(bookCopies),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
	bookAuthors: many(bookAuthors),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
	bookCategories: many(bookCategories),
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

export const bookCopiesRelations = relations(bookCopies, ({ one, many }) => ({
	book: one(books, {
		fields: [bookCopies.bookId],
		references: [books.id],
	}),
	loans: many(loans),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
	bookCopy: one(bookCopies, {
		fields: [loans.bookCopyId],
		references: [bookCopies.id],
	}),
	student: one(students, {
		fields: [loans.stdNo],
		references: [students.stdNo],
	}),
	issuedByUser: one(users, {
		fields: [loans.issuedBy],
		references: [users.id],
		relationName: 'issuedLoans',
	}),
	returnedToUser: one(users, {
		fields: [loans.returnedTo],
		references: [users.id],
		relationName: 'returnedLoans',
	}),
	renewals: many(loanRenewals),
	fines: many(fines),
}));

export const loanRenewalsRelations = relations(loanRenewals, ({ one }) => ({
	loan: one(loans, {
		fields: [loanRenewals.loanId],
		references: [loans.id],
	}),
	renewedByUser: one(users, {
		fields: [loanRenewals.renewedBy],
		references: [users.id],
	}),
}));

export const finesRelations = relations(fines, ({ one }) => ({
	loan: one(loans, {
		fields: [fines.loanId],
		references: [loans.id],
	}),
	student: one(students, {
		fields: [fines.stdNo],
		references: [students.stdNo],
	}),
	receipt: one(paymentReceipts, {
		fields: [fines.receiptId],
		references: [paymentReceipts.id],
	}),
}));

export const digitalResourcesRelations = relations(
	digitalResources,
	({ one }) => ({
		uploadedByUser: one(users, {
			fields: [digitalResources.uploadedBy],
			references: [users.id],
		}),
	})
);
