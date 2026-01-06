import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { graduationRequests, paymentType } from '@/core/database';

export const paymentReceipts = pgTable(
	'payment_receipts',
	{
		id: serial().primaryKey(),
		graduationRequestId: integer()
			.references(() => graduationRequests.id, { onDelete: 'cascade' })
			.notNull(),
		paymentType: paymentType().notNull(),
		receiptNo: text().notNull().unique(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		graduationRequestIdIdx: index(
			'fk_payment_receipts_graduation_request_id'
		).on(table.graduationRequestId),
	})
);
