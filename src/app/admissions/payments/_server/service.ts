import type { bankDeposits, DepositStatus } from '@/core/database';
import {
	generateClientReference,
	initiateMpesaPayment,
	isPaymentSuccessful,
	verifyTransaction,
} from '@/core/integrations/pay-lesotho';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { DepositFilters } from '../_lib/types';
import PaymentRepository from './repository';

class PaymentService extends BaseService<typeof bankDeposits, 'id'> {
	private repo: PaymentRepository;

	constructor() {
		const repo = new PaymentRepository();
		super(repo, {
			byIdRoles: ['registry', 'marketing', 'admin', 'finance'],
			findAllRoles: ['registry', 'marketing', 'admin', 'finance'],
			createRoles: ['registry', 'marketing', 'admin', 'applicant'],
			updateRoles: ['registry', 'marketing', 'admin', 'finance'],
			deleteRoles: ['admin'],
		});
		this.repo = repo;
	}

	async getBankDeposit(id: string) {
		return withAuth(
			async () => this.repo.findBankDepositById(id),
			['registry', 'marketing', 'admin', 'finance']
		);
	}

	async getBankDepositWithDocument(id: string) {
		return withAuth(
			async () => this.repo.findBankDepositWithDocument(id),
			['registry', 'marketing', 'admin', 'finance']
		);
	}

	async searchBankDeposits(
		page: number,
		search: string,
		filters?: DepositFilters
	) {
		return withAuth(
			async () => this.repo.searchBankDeposits(page, search, filters),
			['registry', 'marketing', 'admin', 'finance']
		);
	}

	async getBankDepositsByApplication(applicationId: string) {
		return withAuth(
			async () => this.repo.findBankDepositsByApplication(applicationId),
			['registry', 'marketing', 'admin', 'finance', 'applicant']
		);
	}

	async createBankDeposit(data: typeof bankDeposits.$inferInsert) {
		return withAuth(
			async () => this.repo.createBankDeposit(data),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async verifyBankDeposit(depositId: string, receiptNo: string) {
		return withAuth(
			async (session) => {
				const deposit = await this.repo.findBankDepositById(depositId);
				if (!deposit) {
					throw new Error('Deposit not found');
				}

				if (deposit.status !== 'pending') {
					throw new Error('Deposit is not pending');
				}

				const existingReceipt = await this.repo.findReceiptByNo(receiptNo);
				if (existingReceipt) {
					throw new Error('Receipt number already exists');
				}

				const receipt = await this.repo.createReceipt({
					receiptNo,
					createdBy: session?.user?.id,
				});

				await this.repo.linkReceiptToBankDeposit(depositId, receipt.id);

				if (deposit.application?.id) {
					await this.repo.updateApplicationPaymentStatus(
						deposit.application.id,
						'paid'
					);
				}

				return { deposit, receipt };
			},
			['registry', 'marketing', 'admin', 'finance']
		);
	}

	async rejectBankDeposit(depositId: string) {
		return withAuth(async () => {
			const deposit = await this.repo.findBankDepositById(depositId);
			if (!deposit) {
				throw new Error('Deposit not found');
			}

			if (deposit.status !== 'pending') {
				throw new Error('Deposit is not pending');
			}

			await this.repo.updateBankDepositStatus(depositId, 'rejected');

			if (deposit.application?.id) {
				await this.repo.updateApplicationStatus(
					deposit.application.id,
					'rejected'
				);
			}

			return { success: true };
		}, ['registry', 'marketing', 'admin', 'finance']);
	}

	async countBankDepositsByStatus(status: DepositStatus) {
		return withAuth(
			async () => this.repo.countBankDepositsByStatus(status),
			['registry', 'marketing', 'admin', 'finance']
		);
	}

	async initiateMobilePayment(
		applicationId: string,
		amount: number,
		mobileNumber: string,
		provider: 'mpesa' | 'ecocash'
	) {
		return withAuth(async () => {
			const existing = await this.repo.findPendingMobileDeposit(applicationId);
			if (existing) {
				return {
					success: false,
					error: 'A pending payment already exists for this application',
					isDuplicate: true,
				};
			}

			const clientReference = generateClientReference(applicationId);

			if (provider === 'mpesa') {
				const response = await initiateMpesaPayment(
					amount,
					mobileNumber,
					clientReference
				);

				const deposit = await this.repo.createMobileDeposit({
					applicationId,
					amount: amount.toString(),
					mobileNumber,
					provider,
					clientReference,
					providerReference: response.reference,
					providerResponse: response as unknown as Record<string, unknown>,
					status: isPaymentSuccessful(response) ? 'pending' : 'rejected',
				});

				if (!isPaymentSuccessful(response)) {
					return {
						success: false,
						error: response.message || 'Payment initiation failed',
					};
				}

				return {
					success: true,
					transactionId: deposit.id,
					clientReference,
					message: 'Check your phone for M-Pesa PIN prompt',
				};
			}

			return { success: false, error: 'Unsupported payment provider' };
		}, ['applicant', 'registry', 'marketing', 'admin']);
	}

	async verifyMobilePayment(depositId: string) {
		return withAuth(async () => {
			const deposit = await this.repo.findMobileDepositById(depositId);
			if (!deposit) {
				return { success: false, error: 'Deposit not found', status: 'failed' };
			}

			if (deposit.status === 'verified') {
				return { success: true, status: 'success' };
			}

			if (deposit.status === 'rejected') {
				return { success: false, status: 'failed' };
			}

			if (!deposit.providerReference) {
				return { success: false, status: 'pending' };
			}

			const response = await verifyTransaction(deposit.providerReference);

			if (isPaymentSuccessful(response)) {
				await this.repo.updateMobileDepositStatus(
					depositId,
					'verified',
					response.transaction_id,
					response as unknown as Record<string, unknown>
				);

				if (deposit.application?.id) {
					await this.repo.updateApplicationPaymentStatus(
						deposit.application.id,
						'paid'
					);
				}

				return { success: true, status: 'success' };
			}

			return { success: false, status: 'pending' };
		}, ['applicant', 'registry', 'marketing', 'admin']);
	}

	async getPendingMobileDeposit(applicationId: string) {
		return withAuth(
			async () => this.repo.findPendingMobileDeposit(applicationId),
			['applicant', 'registry', 'marketing', 'admin']
		);
	}

	async getMobileDepositsByApplication(applicationId: string) {
		return withAuth(
			async () => this.repo.findMobileDepositsByApplication(applicationId),
			['applicant', 'registry', 'marketing', 'admin', 'finance']
		);
	}
}

export const paymentsService = serviceWrapper(PaymentService, 'PaymentService');
