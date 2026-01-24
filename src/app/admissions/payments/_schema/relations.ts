import { applications } from '@admissions/applications/_schema/applications';
import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { bankDeposits } from './bankDeposits';
import { paymentTransactions } from './paymentTransactions';

export const paymentTransactionsRelations = relations(
	paymentTransactions,
	({ one }) => ({
		application: one(applications, {
			fields: [paymentTransactions.applicationId],
			references: [applications.id],
		}),
		markedPaidByUser: one(users, {
			fields: [paymentTransactions.markedPaidBy],
			references: [users.id],
		}),
	})
);

export const bankDepositsRelations = relations(bankDeposits, ({ one }) => ({
	application: one(applications, {
		fields: [bankDeposits.applicationId],
		references: [applications.id],
	}),
}));
