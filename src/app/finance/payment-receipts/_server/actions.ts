'use server';

import type { receiptType } from '@/core/database';
import { paymentReceiptService as service } from './service';

type PaymentReceiptData = {
	receiptType: (typeof receiptType.enumValues)[number];
	receiptNo: string;
};

export async function addPaymentReceipt(
	graduationRequestId: number,
	receipt: PaymentReceiptData
) {
	return service.addPaymentReceipt(graduationRequestId, receipt);
}

export async function removePaymentReceipt(receiptId: string) {
	return service.removePaymentReceipt(receiptId);
}
