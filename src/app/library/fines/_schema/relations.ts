import { relations } from 'drizzle-orm';
import { loans, paymentReceipts, students } from '@/core/database';
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
