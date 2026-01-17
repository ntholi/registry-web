import { users } from '@auth/users/_schema/users';
import { paymentReceipts } from '@finance/payment-receipts/_schema/paymentReceipts';
import { students } from '@registry/students/_schema/students';
import { bigint, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const studentCardPrints = pgTable(
	'student_card_prints',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		receiptId: text()
			.references(() => paymentReceipts.id, { onDelete: 'cascade' })
			.notNull(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		printedBy: text()
			.references(() => users.id, { onDelete: 'set null' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		receiptIdIdx: index('fk_student_card_prints_receipt_id').on(
			table.receiptId
		),
		stdNoIdx: index('fk_student_card_prints_std_no').on(table.stdNo),
		printedByIdx: index('fk_student_card_prints_printed_by').on(
			table.printedBy
		),
	})
);
