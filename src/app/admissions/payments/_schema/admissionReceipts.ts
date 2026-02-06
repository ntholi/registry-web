import { users } from '@auth/users/_schema/users';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const admissionReceipts = pgTable(
	'admission_receipts',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		receiptNo: text().notNull().unique(),
		createdBy: text().references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		receiptNoIdx: index('idx_admission_receipts_receipt_no').on(
			table.receiptNo
		),
	})
);
