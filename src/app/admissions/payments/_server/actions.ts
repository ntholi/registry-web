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

export async function rejectBankDeposit(depositId: string) {
	return paymentsService.rejectBankDeposit(depositId);
}

export async function countBankDepositsByStatus(status: DepositStatus) {
	return paymentsService.countBankDepositsByStatus(status);
}

export async function deleteBankDeposit(id: string) {
	return paymentsService.delete(id);
}
