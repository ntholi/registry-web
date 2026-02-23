'use server';

import type { bankDeposits, DepositStatus } from '@/core/database';
import type { DepositFilters } from '../_lib/types';
import { paymentsService } from './service';

export async function getBankDeposit(id: string) {
	return paymentsService.getBankDeposit(id);
}

export async function getBankDepositWithDocument(id: string) {
	return paymentsService.getBankDepositWithDocument(id);
}

export async function getBankDeposits(
	page = 1,
	search = '',
	filters?: DepositFilters
) {
	return paymentsService.searchBankDeposits(page, search, filters);
}

export async function getBankDepositsByApplication(applicationId: string) {
	return paymentsService.getBankDepositsByApplication(applicationId);
}

export async function createBankDeposit(
	data: typeof bankDeposits.$inferInsert
) {
	return paymentsService.createBankDeposit(data);
}

export async function verifyBankDeposit(depositId: string, receiptNo: string) {
	return paymentsService.verifyBankDeposit(depositId, receiptNo);
}

export async function rejectBankDeposit(
	depositId: string,
	rejectionReason?: string
) {
	return paymentsService.rejectBankDeposit(depositId, rejectionReason);
}

export async function countBankDepositsByStatus(status: DepositStatus) {
	return paymentsService.countBankDepositsByStatus(status);
}

export async function countPendingPaymentsForReview() {
	return paymentsService.countBankDepositsByStatus('pending');
}

export async function updatePaymentReviewStatus(
	id: string,
	status: DepositStatus,
	rejectionReason?: string
) {
	return paymentsService.updateReviewStatus(id, status, rejectionReason);
}

export async function acquirePaymentReviewLock(depositId: string) {
	return paymentsService.acquireLock(depositId);
}

export async function releasePaymentReviewLock(depositId: string) {
	return paymentsService.releaseLock(depositId);
}

export async function releaseAllPaymentReviewLocks() {
	return paymentsService.releaseAllLocks();
}

export async function getNextPaymentForReview(
	currentId: string,
	filters?: {
		status?: DepositStatus;
	}
) {
	return paymentsService.findNextUnlocked(currentId, filters);
}

export async function deleteBankDeposit(id: string) {
	return paymentsService.delete(id);
}

export async function initiateMobilePayment(
	applicationId: string,
	amount: number,
	mobileNumber: string,
	provider: 'mpesa' | 'ecocash' = 'mpesa'
) {
	return paymentsService.initiateMobilePayment(
		applicationId,
		amount,
		mobileNumber,
		provider
	);
}

export async function verifyMobilePayment(depositId: string) {
	return paymentsService.verifyMobilePayment(depositId);
}

export async function getPendingMobileDeposit(applicationId: string) {
	return paymentsService.getPendingMobileDeposit(applicationId);
}

export async function getMobileDepositsByApplication(applicationId: string) {
	return paymentsService.getMobileDepositsByApplication(applicationId);
}
