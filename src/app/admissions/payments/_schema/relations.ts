import { applicants } from '@admissions/applicants/_schema/applicants';
import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { paymentTransactions } from './paymentTransactions';

export const paymentTransactionsRelations = relations(
	paymentTransactions,
	({ one }) => ({
		applicant: one(applicants, {
			fields: [paymentTransactions.applicantId],
			references: [applicants.id],
		}),
		markedPaidByUser: one(users, {
			fields: [paymentTransactions.markedPaidBy],
			references: [users.id],
		}),
	})
);
