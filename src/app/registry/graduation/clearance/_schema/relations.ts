import { paymentReceipts } from '@finance/payment-receipts/_schema/paymentReceipts';
import { clearance } from '@registry/clearance/_schema/clearance';
import { relations } from 'drizzle-orm';
import { graduationRequests } from '@/app/registry/graduation/requests/_schema/graduationRequests';
import { graduationClearance } from './graduationClearance';
import { graduationRequestReceipts } from './graduationRequestReceipts';

export const graduationClearanceRelations = relations(
	graduationClearance,
	({ one }) => ({
		graduationRequest: one(graduationRequests, {
			fields: [graduationClearance.graduationRequestId],
			references: [graduationRequests.id],
		}),
		clearance: one(clearance, {
			fields: [graduationClearance.clearanceId],
			references: [clearance.id],
		}),
	})
);

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
