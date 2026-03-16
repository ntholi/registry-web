'use server';

import type { bankDeposits, DepositStatus } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
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

export const createBankDeposit = createAction(
	async (data: typeof bankDeposits.$inferInsert) =>
		paymentsService.createBankDeposit(data)
);

export const verifyBankDeposit = createAction(
	async (depositId: string, receiptNo: string) =>
		paymentsService.verifyBankDeposit(depositId, receiptNo)
);

export const rejectBankDeposit = createAction(
	async (depositId: string, rejectionReason?: string) =>
		paymentsService.rejectBankDeposit(depositId, rejectionReason)
);

export async function countBankDepositsByStatus(status: DepositStatus) {
	return paymentsService.countBankDepositsByStatus(status);
}

export async function countPendingPaymentsForReview() {
	return paymentsService.countBankDepositsByStatus('pending');
}

export const updatePaymentReviewStatus = createAction(
	async (id: string, status: DepositStatus, rejectionReason?: string) =>
		paymentsService.updateReviewStatus(id, status, rejectionReason)
);

export const acquirePaymentReviewLock = createAction(
	async (depositId: string) => paymentsService.acquireLock(depositId)
);

export const releasePaymentReviewLock = createAction(
	async (depositId: string) => paymentsService.releaseLock(depositId)
);

export const releaseAllPaymentReviewLocks = createAction(async () =>
	paymentsService.releaseAllLocks()
);

export async function getNextPaymentForReview(
	currentId: string,
	filters?: {
		status?: DepositStatus;
	}
) {
	return paymentsService.findNextUnlocked(currentId, filters);
}

export const deleteBankDeposit = createAction(async (id: string) =>
	paymentsService.delete(id)
);

export const initiateMobilePayment = createAction(
	async (
		applicationId: string,
		amount: number,
		mobileNumber: string,
		provider: 'mpesa' | 'ecocash' = 'mpesa'
	) =>
		paymentsService.initiateMobilePayment(
			applicationId,
			amount,
			mobileNumber,
			provider
		)
);

export const verifyMobilePayment = createAction(async (depositId: string) =>
	paymentsService.verifyMobilePayment(depositId)
);

export async function getPendingMobileDeposit(applicationId: string) {
	return paymentsService.getPendingMobileDeposit(applicationId);
}

export async function getMobileDepositsByApplication(applicationId: string) {
	return paymentsService.getMobileDepositsByApplication(applicationId);
}
