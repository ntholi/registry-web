import { paymentReceipts } from '@finance/payment-receipts/_schema/paymentReceipts';
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core';
import { registrationRequests } from './registrationRequests';

export const registrationRequestReceipts = pgTable(
	'registration_request_receipts',
	{
		registrationRequestId: integer()
			.references(() => registrationRequests.id, { onDelete: 'cascade' })
			.notNull(),
		receiptId: text()
			.references(() => paymentReceipts.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		pk: unique().on(table.registrationRequestId, table.receiptId),
		registrationRequestIdIdx: index(
			'fk_registration_request_receipts_registration_request_id'
		).on(table.registrationRequestId),
		receiptIdIdx: index('fk_registration_request_receipts_receipt_id').on(
			table.receiptId
		),
	})
);
