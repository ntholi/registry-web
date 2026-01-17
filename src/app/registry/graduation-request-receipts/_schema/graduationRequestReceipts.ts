import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { graduationRequests, paymentReceipts } from '@/core/database';

export const graduationRequestReceipts = pgTable(
	'graduation_request_receipts',
	{
		graduationRequestId: integer()
			.references(() => graduationRequests.id, { onDelete: 'cascade' })
			.notNull(),
		receiptId: text()
			.references(() => paymentReceipts.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		pk: unique().on(table.graduationRequestId, table.receiptId),
		graduationRequestIdIdx: index(
			'fk_graduation_request_receipts_graduation_request_id'
		).on(table.graduationRequestId),
		receiptIdIdx: index('fk_graduation_request_receipts_receipt_id').on(
			table.receiptId
		),
	})
);
