import {
	bigint,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { bookCopies, students, users } from '@/core/database';

export const loanStatus = pgEnum('loan_status', [
	'Active',
	'Returned',
	'Overdue',
]);
export type LoanStatus = (typeof loanStatus.enumValues)[number];

export const loans = pgTable(
	'loans',
	{
		id: serial().primaryKey(),
		bookCopyId: integer()
			.references(() => bookCopies.id, { onDelete: 'cascade' })
			.notNull(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		loanDate: timestamp().notNull().defaultNow(),
		dueDate: timestamp().notNull(),
		returnDate: timestamp(),
		status: loanStatus().notNull().default('Active'),
		issuedBy: text().references(() => users.id, { onDelete: 'set null' }),
		returnedTo: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		bookCopyIdIdx: index('idx_loans_book_copy_id').on(table.bookCopyId),
		stdNoIdx: index('idx_loans_std_no').on(table.stdNo),
		statusIdx: index('idx_loans_status').on(table.status),
		dueDateIdx: index('idx_loans_due_date').on(table.dueDate),
		stdNoStatusIdx: index('idx_loans_std_no_status').on(
			table.stdNo,
			table.status
		),
	})
);

export const loanRenewals = pgTable(
	'loan_renewals',
	{
		id: serial().primaryKey(),
		loanId: integer()
			.references(() => loans.id, { onDelete: 'cascade' })
			.notNull(),
		previousDueDate: timestamp().notNull(),
		newDueDate: timestamp().notNull(),
		renewedBy: text().references(() => users.id, { onDelete: 'set null' }),
		renewedAt: timestamp().defaultNow(),
	},
	(table) => ({
		loanIdIdx: index('idx_loan_renewals_loan_id').on(table.loanId),
	})
);
