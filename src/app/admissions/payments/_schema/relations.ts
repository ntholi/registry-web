import { applications } from '@admissions/applications/_schema/applications';
import { users } from '@auth/users/_schema/users';
import { relations } from 'drizzle-orm';
import { admissionReceipts } from './admissionReceipts';
import { bankDeposits } from './bankDeposits';
import { mobileDeposits } from './mobileDeposits';

export const admissionReceiptsRelations = relations(
	admissionReceipts,
	({ one, many }) => ({
		createdByUser: one(users, {
			fields: [admissionReceipts.createdBy],
			references: [users.id],
		}),
		bankDeposits: many(bankDeposits),
		mobileDeposits: many(mobileDeposits),
	})
);

export const bankDepositsRelations = relations(bankDeposits, ({ one }) => ({
	application: one(applications, {
		fields: [bankDeposits.applicationId],
		references: [applications.id],
	}),
	receipt: one(admissionReceipts, {
		fields: [bankDeposits.receiptId],
		references: [admissionReceipts.id],
	}),
}));

export const mobileDepositsRelations = relations(mobileDeposits, ({ one }) => ({
	application: one(applications, {
		fields: [mobileDeposits.applicationId],
		references: [applications.id],
	}),
	receipt: one(admissionReceipts, {
		fields: [mobileDeposits.receiptId],
		references: [admissionReceipts.id],
	}),
}));
