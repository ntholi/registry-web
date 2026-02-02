import type { bankDeposits, DepositStatus } from '@/core/database';
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
}

export const paymentsService = serviceWrapper(PaymentService, 'PaymentService');
