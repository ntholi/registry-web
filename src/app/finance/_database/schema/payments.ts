import { users } from '@auth/_database';
import { students } from '@registry/_database';
import { bigint, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { receiptType } from './enums';

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
