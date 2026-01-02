'use server';

import type { paymentType } from '@/core/database';
import { paymentReceiptService as service } from './service';

type PaymentReceiptData = {
	paymentType: (typeof paymentType.enumValues)[number];
	receiptNo: string;
};

export async function addPaymentReceipt(
	graduationRequestId: number,
	receipt: PaymentReceiptData
) {
	return service.addPaymentReceipt(graduationRequestId, receipt);
}

export async function removePaymentReceipt(receiptId: number) {
	return service.removePaymentReceipt(receiptId);
}
