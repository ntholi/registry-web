import { users } from '@auth/users/_schema/users';
import { students } from '@registry/students/_schema/students';
import {
	bigint,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const receiptType = pgEnum('receipt_type', [
	'graduation_gown',
	'graduation_fee',
	'student_card',
	'repeat_modules',
	'late_registration',
	'tuition_fee',
	'library_fine',
]);
export type ReceiptType = (typeof receiptType.enumValues)[number];

export const paymentReceipts = pgTable(
	'payment_receipts',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		receiptNo: text().notNull().unique(),
		receiptType: receiptType().notNull(),
		stdNo: bigint({ mode: 'number' })
			.references(() => students.stdNo, { onDelete: 'cascade' })
			.notNull(),
		createdBy: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		stdNoIdx: index('fk_payment_receipts_std_no').on(table.stdNo),
		receiptTypeIdx: index('idx_payment_receipts_receipt_type').on(
			table.receiptType
		),
	})
);
