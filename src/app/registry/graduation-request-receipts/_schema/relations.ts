import { relations } from 'drizzle-orm';
import { graduationRequests, paymentReceipts } from '@/core/database';
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
