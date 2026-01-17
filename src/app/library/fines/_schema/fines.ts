import {
	bigint,
	index,
	integer,
	pgEnum,
	pgTable,
	real,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { loans, paymentReceipts, students } from '@/core/database';

export const fineStatus = pgEnum('fine_status', ['Unpaid', 'Paid']);
export type FineStatus = (typeof fineStatus.enumValues)[number];

export const fines = pgTable(
	'fines',
	{
		id: serial().primaryKey(),
		loanId: integer()
			.references(() => loans.id, { onDelete: 'cascade' })
			.notNull(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		amount: real().notNull(),
		daysOverdue: integer().notNull(),
		status: fineStatus().notNull().default('Unpaid'),
		receiptId: text().references(() => paymentReceipts.id, {
			onDelete: 'set null',
		}),
		createdAt: timestamp().defaultNow(),
		paidAt: timestamp(),
	},
	(table) => ({
		loanIdIdx: index('idx_fines_loan_id').on(table.loanId),
		stdNoIdx: index('idx_fines_std_no').on(table.stdNo),
		statusIdx: index('idx_fines_status').on(table.status),
		receiptIdIdx: index('idx_fines_receipt_id').on(table.receiptId),
	})
);
