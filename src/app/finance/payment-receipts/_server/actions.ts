'use server';

import type { receiptType } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { paymentReceiptService as service } from './service';

type PaymentReceiptData = {
	receiptType: (typeof receiptType.enumValues)[number];
	receiptNo: string;
};

export const addPaymentReceipt = createAction(
	async (graduationRequestId: number, receipt: PaymentReceiptData) =>
		service.addPaymentReceipt(graduationRequestId, receipt)
);

export const removePaymentReceipt = createAction(async (receiptId: string) =>
	service.removePaymentReceipt(receiptId)
);
