import { applications } from '@admissions/applications/_schema/applications';
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
import { admissionReceipts } from './admissionReceipts';
import { depositStatus } from './bankDeposits';

export const mobileProvider = pgEnum('mobile_provider', ['mpesa', 'ecocash']);
export type MobileProvider = (typeof mobileProvider.enumValues)[number];

export const mobileDeposits = pgTable(
	'mobile_deposits',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		applicationId: text()
			.notNull()
			.references(() => applications.id, { onDelete: 'cascade' }),
		receiptId: text().references(() => admissionReceipts.id, {
			onDelete: 'set null',
		}),
		status: depositStatus().notNull().default('pending'),
		amount: decimal({ precision: 10, scale: 2 }).notNull(),
		mobileNumber: text().notNull(),
		provider: mobileProvider().notNull(),
		clientReference: text().notNull().unique(),
		providerReference: text(),
		providerResponse: json(),
		createdAt: timestamp().defaultNow(),
		updatedAt: timestamp()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		applicationIdx: index('fk_mobile_deposits_application').on(
			table.applicationId
		),
		statusIdx: index('idx_mobile_deposits_status').on(table.status),
		clientRefIdx: index('idx_mobile_deposits_client_ref').on(
			table.clientReference
		),
		receiptIdx: index('fk_mobile_deposits_receipt').on(table.receiptId),
	})
);
