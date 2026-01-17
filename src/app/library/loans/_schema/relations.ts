import { relations } from 'drizzle-orm';
import { bookCopies, fines, students, users } from '@/core/database';
import { loanRenewals, loans } from './loans';

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
