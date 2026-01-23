'use server';

import type {
	InitiatePaymentInput,
	PaymentFilters,
	TransactionStatus,
} from '../_lib/types';
import { paymentsService } from './service';

export async function getPayment(id: string) {
	return paymentsService.getWithRelations(id);
}

export async function getPayments(
	page = 1,
	search = '',
	filters?: PaymentFilters
) {
	return paymentsService.search(page, search, filters);
}

export async function initiatePayment(input: InitiatePaymentInput) {
	return paymentsService.initiatePayment(input);
}

export async function verifyPayment(transactionId: string) {
	return paymentsService.verifyPayment(transactionId);
}

export async function markPaymentAsPaid(
	transactionId: string,
	manualReference: string
) {
	return paymentsService.markAsPaid(transactionId, manualReference);
}

export async function getPaymentsByApplicant(applicantId: string) {
	return paymentsService.getByApplicant(applicantId);
}

export async function getPendingPayment(applicantId: string) {
	return paymentsService.getPendingByApplicant(applicantId);
}

export async function countPaymentsByStatus(status: TransactionStatus) {
	return paymentsService.countByStatus(status);
}

export async function deletePayment(id: string) {
	return paymentsService.delete(id);
}
