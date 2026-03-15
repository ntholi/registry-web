'use server';

import type { bankDeposits, DepositStatus } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import type { DepositFilters } from '../_lib/types';
import { paymentsService } from './service';

export const getBankDeposit = createAction(async (id: string) => {
	return paymentsService.getBankDeposit(id);
});

export const getBankDepositWithDocument = createAction(async (id: string) => {
	return paymentsService.getBankDepositWithDocument(id);
});

export const getBankDeposits = createAction(
	async (page: number = 1, search: string = '', filters?: DepositFilters) => {
		return paymentsService.searchBankDeposits(page, search, filters);
	}
);

export const getBankDepositsByApplication = createAction(
	async (applicationId: string) => {
		return paymentsService.getBankDepositsByApplication(applicationId);
	}
);

export const createBankDeposit = createAction(
	async (data: typeof bankDeposits.$inferInsert) => {
		return paymentsService.createBankDeposit(data);
	}
);

export const verifyBankDeposit = createAction(
	async (depositId: string, receiptNo: string) => {
		return paymentsService.verifyBankDeposit(depositId, receiptNo);
	}
);

export const rejectBankDeposit = createAction(
	async (depositId: string, rejectionReason?: string) => {
		return paymentsService.rejectBankDeposit(depositId, rejectionReason);
	}
);

export const countBankDepositsByStatus = createAction(
	async (status: DepositStatus) => {
		return paymentsService.countBankDepositsByStatus(status);
	}
);

export const countPendingPaymentsForReview = createAction(async () => {
	return paymentsService.countBankDepositsByStatus('pending');
});

export const updatePaymentReviewStatus = createAction(
	async (id: string, status: DepositStatus, rejectionReason?: string) => {
		return paymentsService.updateReviewStatus(id, status, rejectionReason);
	}
);

export const acquirePaymentReviewLock = createAction(
	async (depositId: string) => {
		return paymentsService.acquireLock(depositId);
	}
);

export const releasePaymentReviewLock = createAction(
	async (depositId: string) => {
		return paymentsService.releaseLock(depositId);
	}
);

export const releaseAllPaymentReviewLocks = createAction(async () => {
	return paymentsService.releaseAllLocks();
});

export const getNextPaymentForReview = createAction(
	async (
		currentId: string,
		filters?: {
			status?: DepositStatus;
		}
	) => {
		return paymentsService.findNextUnlocked(currentId, filters);
	}
);

export const deleteBankDeposit = createAction(async (id: string) => {
	return paymentsService.delete(id);
});

export const initiateMobilePayment = createAction(
	async (
		applicationId: string,
		amount: number,
		mobileNumber: string,
		provider: 'mpesa' | 'ecocash' = 'mpesa'
	) => {
		return paymentsService.initiateMobilePayment(
			applicationId,
			amount,
			mobileNumber,
			provider
		);
	}
);

export const verifyMobilePayment = createAction(async (depositId: string) => {
	return paymentsService.verifyMobilePayment(depositId);
});

export const getPendingMobileDeposit = createAction(
	async (applicationId: string) => {
		return paymentsService.getPendingMobileDeposit(applicationId);
	}
);

export const getMobileDepositsByApplication = createAction(
	async (applicationId: string) => {
		return paymentsService.getMobileDepositsByApplication(applicationId);
	}
);
