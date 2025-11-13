'use server';

import type { paymentReceipts, paymentType } from '@/core/db/schema';
import { paymentReceiptService as service } from './service';

type PaymentReceipt = typeof paymentReceipts.$inferInsert;

type PaymentReceiptData = {
	paymentType: (typeof paymentType.enumValues)[number];
	receiptNo: string;
};

export async function getPaymentReceipt(id: number) {
	return service.get(id);
}

export async function getPaymentReceipts(page: number = 1, search = '') {
	return service.getAll({ page, search });
}

export async function getPaymentReceiptsByGraduationRequest(
	graduationRequestId: number
) {
	return service.getByGraduationRequest(graduationRequestId);
}

export async function createPaymentReceipt(receipt: PaymentReceipt) {
	return service.create(receipt);
}

export async function createPaymentReceipts(receipts: PaymentReceipt[]) {
	return service.createMany(receipts);
}

export async function updatePaymentReceipt(
	id: number,
	receipt: Partial<PaymentReceipt>
) {
	return service.update(id, receipt);
}

export async function deletePaymentReceipt(id: number) {
	return service.delete(id);
}

export async function updateGraduationPaymentReceipts(
	graduationRequestId: number,
	receipts: PaymentReceiptData[]
) {
	return service.updateGraduationPaymentReceipts(graduationRequestId, receipts);
}

export async function addPaymentReceipt(
	graduationRequestId: number,
	receipt: PaymentReceiptData
) {
	return service.addPaymentReceipt(graduationRequestId, receipt);
}

export async function removePaymentReceipt(receiptId: number) {
	return service.removePaymentReceipt(receiptId);
}
