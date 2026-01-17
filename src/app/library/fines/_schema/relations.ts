import { paymentReceipts } from '@finance/payment-receipts/_schema/paymentReceipts';
import { loans } from '@library/loans/_schema/loans';
import { students } from '@registry/students/_schema/students';
import { relations } from 'drizzle-orm';
import { fines } from './fines';

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
