import { paymentReceipts } from '@finance/payment-receipts/_schema/paymentReceipts';
import { graduationRequests } from '@registry/graduation-requests/_schema/graduationRequests';
import { relations } from 'drizzle-orm';
import { graduationRequestReceipts } from './graduationRequestReceipts';

export const graduationRequestReceiptsRelations = relations(
	graduationRequestReceipts,
	({ one }) => ({
		graduationRequest: one(graduationRequests, {
			fields: [graduationRequestReceipts.graduationRequestId],
			references: [graduationRequests.id],
		}),
		receipt: one(paymentReceipts, {
			fields: [graduationRequestReceipts.receiptId],
			references: [paymentReceipts.id],
		}),
	})
);
