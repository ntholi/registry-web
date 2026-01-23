import { applicants } from '@admissions/applicants/_schema/applicants';
import { users } from '@auth/users/_schema/users';
import {
	decimal,
	index,
	json,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const paymentProviderEnum = pgEnum('payment_provider', [
	'mpesa',
	'ecocash',
]);
export type PaymentProvider = (typeof paymentProviderEnum.enumValues)[number];

export const transactionStatusEnum = pgEnum('transaction_status', [
	'pending',
	'success',
	'failed',
]);
export type TransactionStatus =
	(typeof transactionStatusEnum.enumValues)[number];

export const paymentTransactions = pgTable(
	'payment_transactions',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		applicantId: text()
			.references(() => applicants.id, { onDelete: 'cascade' })
			.notNull(),
		amount: decimal({ precision: 10, scale: 2 }).notNull(),
		mobileNumber: text().notNull(),
		provider: paymentProviderEnum().notNull(),
		status: transactionStatusEnum().notNull().default('pending'),
		clientReference: text().notNull().unique(),
		providerReference: text(),
		providerResponse: json(),
		manualReference: text(),
		markedPaidBy: text().references(() => users.id, { onDelete: 'set null' }),
		receiptNumber: text(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		applicantIdx: index('fk_payment_transactions_applicant').on(
			table.applicantId
		),
		statusIdx: index('idx_payment_transactions_status').on(table.status),
		clientRefIdx: index('idx_payment_transactions_client_ref').on(
			table.clientReference
		),
	})
);
