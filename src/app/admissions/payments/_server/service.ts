import { hasSessionPermission } from '@/core/auth/sessionPermissions';
import type { bankDeposits, DepositStatus } from '@/core/database';
import {
	generateClientReference,
	initiateMpesaPayment,
	isPaymentSuccessful,
	verifyTransaction,
} from '@/core/integrations/pay-lesotho';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import type { DepositFilters } from '../_lib/types';
import PaymentRepository from './repository';

class PaymentService extends BaseService<typeof bankDeposits, 'id'> {
	private repo: PaymentRepository;

	constructor() {
		const repo = new PaymentRepository();
		super(repo, {
			byIdAuth: { 'admissions-payments': ['read'] },
			findAllAuth: { 'admissions-payments': ['read'] },
			createAuth: { 'admissions-payments': ['create'] },
			updateAuth: { 'admissions-payments': ['update'] },
			deleteAuth: { 'admissions-payments': ['delete'] },
			activityTypes: {
				create: 'deposit_submitted',
				update: 'deposit_verified',
				delete: 'deposit_deleted',
			},
		});
		this.repo = repo;
	}

	async getBankDeposit(id: string) {
		return withPermission(async () => this.repo.findBankDepositById(id), {
			'admissions-payments': ['read'],
		});
	}

	async getBankDepositWithDocument(id: string) {
		return withPermission(
			async () => this.repo.findBankDepositWithDocument(id),
			{ 'admissions-payments': ['read'] }
		);
	}

	async searchBankDeposits(
		page: number,
		search: string,
		filters?: DepositFilters
	) {
		return withPermission(
			async (session) =>
				this.repo.searchBankDeposits(page, search, filters, session?.user?.id),
			{ 'admissions-payments': ['read'] }
		);
	}

	async getBankDepositsByApplication(applicationId: string) {
		return withPermission(
			async () => this.repo.findBankDepositsByApplication(applicationId),
			async (session) =>
				hasSessionPermission(session, 'admissions-payments', 'read', [
					'applicant',
					'user',
				])
		);
	}

	async createDepositsWithDocuments(
		items: Parameters<PaymentRepository['createDepositsWithDocuments']>[0]
	) {
		return withPermission(
			async () => this.repo.createDepositsWithDocuments(items),
			async (session) =>
				hasSessionPermission(session, 'admissions-payments', 'create', [
					'applicant',
					'user',
				])
		);
	}

	async createBankDeposit(data: typeof bankDeposits.$inferInsert) {
		return withPermission(
			async (session) =>
				this.repo.createBankDeposit(
					data,
					this.buildAuditOptions(session, 'create')
				),
			async (session) =>
				hasSessionPermission(session, 'admissions-payments', 'create', [
					'applicant',
					'user',
				])
		);
	}

	async verifyBankDeposit(depositId: string, receiptNo: string) {
		return withPermission(
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

				const audit = this.buildAuditOptions(session, 'update');

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

				await this.repo.updateBankDepositStatus(
					depositId,
					'verified',
					undefined,
					audit
				);

				return { deposit, receipt };
			},
			{ 'admissions-payments': ['update'] }
		);
	}

	async rejectBankDeposit(depositId: string, rejectionReason?: string) {
		return withPermission(
			async (session) => {
				const deposit = await this.repo.findBankDepositById(depositId);
				if (!deposit) {
					throw new Error('Deposit not found');
				}

				if (deposit.status !== 'pending') {
					throw new Error('Deposit is not pending');
				}

				const audit = this.buildAuditOptions(session, 'update');

				await this.repo.updateBankDepositStatus(
					depositId,
					'rejected',
					rejectionReason,
					audit
				);

				if (deposit.application?.id) {
					await this.repo.updateApplicationStatus(
						deposit.application.id,
						'rejected'
					);
				}

				return { success: true };
			},
			{ 'admissions-payments': ['update'] }
		);
	}

	async updateReviewStatus(
		depositId: string,
		status: DepositStatus,
		rejectionReason?: string
	) {
		return withPermission(
			async (session) =>
				this.repo.updateBankDepositStatus(
					depositId,
					status,
					rejectionReason,
					this.buildAuditOptions(session, 'update')
				),
			{ 'admissions-payments': ['update'] }
		);
	}

	async countBankDepositsByStatus(status: DepositStatus) {
		return withPermission(
			async () => this.repo.countBankDepositsByStatus(status),
			{ 'admissions-payments': ['read'] }
		);
	}

	async acquireLock(depositId: string) {
		return withPermission(
			async (session) => {
				const userId = session?.user?.id;
				if (!userId) return null;
				return this.repo.acquireLock(depositId, userId);
			},
			{ 'admissions-payments': ['update'] }
		);
	}

	async releaseLock(depositId: string) {
		return withPermission(
			async (session) => {
				const userId = session?.user?.id;
				if (!userId) return null;
				return this.repo.releaseLock(depositId, userId);
			},
			{ 'admissions-payments': ['update'] }
		);
	}

	async releaseAllLocks() {
		return withPermission(
			async (session) => {
				const userId = session?.user?.id;
				if (!userId) return;
				return this.repo.releaseAllLocks(userId);
			},
			{ 'admissions-payments': ['update'] }
		);
	}

	async findNextUnlocked(
		currentId: string,
		filters?: {
			status?: DepositStatus;
		}
	) {
		return withPermission(
			async (session) => {
				const userId = session?.user?.id;
				if (!userId) return null;
				return this.repo.findNextUnlocked(currentId, userId, filters);
			},
			{ 'admissions-payments': ['read'] }
		);
	}

	async initiateMobilePayment(
		applicationId: string,
		amount: number,
		mobileNumber: string,
		provider: 'mpesa' | 'ecocash'
	) {
		return withPermission(
			async (session) => {
				const existing =
					await this.repo.findPendingMobileDeposit(applicationId);
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

					const deposit = await this.repo.createMobileDeposit(
						{
							applicationId,
							amount: amount.toString(),
							mobileNumber,
							provider,
							clientReference,
							providerReference: response.reference,
							providerResponse: response as unknown as Record<string, unknown>,
							status: isPaymentSuccessful(response) ? 'pending' : 'rejected',
						},
						this.buildAuditOptions(session, 'create')
					);

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
			},
			async (session) =>
				hasSessionPermission(session, 'admissions-payments', 'create', [
					'applicant',
					'user',
				])
		);
	}

	async verifyMobilePayment(depositId: string) {
		return withPermission(
			async () => {
				const deposit = await this.repo.findMobileDepositById(depositId);
				if (!deposit) {
					return {
						success: false,
						error: 'Deposit not found',
						status: 'failed',
					};
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
			},
			async (session) =>
				hasSessionPermission(session, 'admissions-payments', 'read', [
					'applicant',
					'user',
				])
		);
	}

	async getPendingMobileDeposit(applicationId: string) {
		return withPermission(
			async () => this.repo.findPendingMobileDeposit(applicationId),
			async (session) =>
				hasSessionPermission(session, 'admissions-payments', 'read', [
					'applicant',
					'user',
				])
		);
	}

	async getMobileDepositsByApplication(applicationId: string) {
		return withPermission(
			async () => this.repo.findMobileDepositsByApplication(applicationId),
			async (session) =>
				hasSessionPermission(session, 'admissions-payments', 'read', [
					'applicant',
					'user',
				])
		);
	}
}

export const paymentsService = serviceWrapper(PaymentService, 'PaymentService');
