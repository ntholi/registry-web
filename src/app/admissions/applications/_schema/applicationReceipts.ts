import { paymentReceipts } from '@finance/payment-receipts/_schema/paymentReceipts';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { applications } from './applications';

export const applicationReceipts = pgTable(
	'application_receipts',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		applicationId: text()
			.references(() => applications.id, { onDelete: 'cascade' })
			.notNull(),
		receiptId: text()
			.references(() => paymentReceipts.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		applicationIdx: index('fk_application_receipts_app').on(
			table.applicationId
		),
		receiptIdx: index('fk_application_receipts_receipt').on(table.receiptId),
	})
);
