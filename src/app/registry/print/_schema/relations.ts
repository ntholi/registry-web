import { relations } from 'drizzle-orm';
import { paymentReceipts, students, users } from '@/core/database';
import { statementOfResultsPrints } from './statementOfResultsPrints';
import { studentCardPrints } from './studentCardPrints';
import { transcriptPrints } from './transcriptPrints';

export const statementOfResultsPrintsRelations = relations(
	statementOfResultsPrints,
	({ one }) => ({
		student: one(students, {
			fields: [statementOfResultsPrints.stdNo],
			references: [students.stdNo],
		}),
		printedByUser: one(users, {
			fields: [statementOfResultsPrints.printedBy],
			references: [users.id],
		}),
	})
);

export const transcriptPrintsRelations = relations(
	transcriptPrints,
	({ one }) => ({
		student: one(students, {
			fields: [transcriptPrints.stdNo],
			references: [students.stdNo],
		}),
		printedByUser: one(users, {
			fields: [transcriptPrints.printedBy],
			references: [users.id],
		}),
	})
);

export const studentCardPrintsRelations = relations(
	studentCardPrints,
	({ one }) => ({
		receipt: one(paymentReceipts, {
			fields: [studentCardPrints.receiptId],
			references: [paymentReceipts.id],
		}),
		student: one(students, {
			fields: [studentCardPrints.stdNo],
			references: [students.stdNo],
		}),
		printedByUser: one(users, {
			fields: [studentCardPrints.printedBy],
			references: [users.id],
		}),
	})
);
