import { applications } from '@admissions/applications/_schema/applications';
import { documents } from '@registry/documents/_schema/documents';
import {
	decimal,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { admissionReceipts } from './admissionReceipts';

export const depositStatus = pgEnum('deposit_status', [
	'pending',
	'verified',
	'rejected',
]);
export type DepositStatus = (typeof depositStatus.enumValues)[number];

export const bankDeposits = pgTable(
	'bank_deposits',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		applicationId: text()
			.notNull()
			.references(() => applications.id, { onDelete: 'cascade' }),
		documentId: text()
			.notNull()
			.references(() => documents.id, { onDelete: 'cascade' }),
		receiptId: text().references(() => admissionReceipts.id, {
			onDelete: 'set null',
		}),
		status: depositStatus().notNull().default('pending'),
		reference: text().notNull(),
		beneficiaryName: text(),
		dateDeposited: text(),
		amountDeposited: decimal({ precision: 10, scale: 2 }),
		currency: text(),
		depositorName: text(),
		bankName: text(),
		transactionNumber: text(),
		terminalNumber: text(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => ({
		applicationIdx: index('fk_bank_deposits_application').on(
			table.applicationId
		),
		referenceIdx: index('idx_bank_deposits_reference').on(table.reference),
		statusIdx: index('idx_bank_deposits_status').on(table.status),
		receiptIdx: index('fk_bank_deposits_receipt').on(table.receiptId),
	})
);
