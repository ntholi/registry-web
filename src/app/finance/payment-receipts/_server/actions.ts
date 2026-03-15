'use server';

import type { receiptType } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { paymentReceiptService as service } from './service';

type PaymentReceiptData = {
	receiptType: (typeof receiptType.enumValues)[number];
	receiptNo: string;
};

export const addPaymentReceipt = createAction(
	async (graduationRequestId: number, receipt: PaymentReceiptData) => {
		return service.addPaymentReceipt(graduationRequestId, receipt);
	}
);

export const removePaymentReceipt = createAction(async (receiptId: string) => {
	return service.removePaymentReceipt(receiptId);
});
