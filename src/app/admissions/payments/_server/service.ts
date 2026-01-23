import { eq } from 'drizzle-orm';
import { applications, db, paymentTransactions } from '@/core/database';
import {
	generateClientReference,
	initiateMpesaPayment,
	isPaymentSuccessful,
	verifyTransaction,
} from '@/core/integrations/pay-lesotho';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type {
	InitiatePaymentInput,
	PaymentFilters,
	TransactionStatus,
} from '../_lib/types';
import PaymentRepository from './repository';

class PaymentService extends BaseService<typeof paymentTransactions, 'id'> {
	private repo: PaymentRepository;

	constructor() {
		const repo = new PaymentRepository();
		super(repo, {
			byIdRoles: ['registry', 'marketing', 'admin'],
			findAllRoles: ['registry', 'marketing', 'admin'],
			createRoles: ['registry', 'marketing', 'admin', 'applicant'],
			updateRoles: ['registry', 'marketing', 'admin'],
			deleteRoles: ['admin'],
		});
		this.repo = repo;
	}

	async getWithRelations(id: string) {
		return withAuth(
			async () => this.repo.findByIdWithRelations(id),
			['registry', 'marketing', 'admin']
		);
	}

	async search(page: number, search: string, filters?: PaymentFilters) {
		return withAuth(
			async () => this.repo.search(page, search, filters),
			['registry', 'marketing', 'admin']
		);
	}

	async initiatePayment(input: InitiatePaymentInput) {
		return withAuth(async () => {
			const existingSuccess = await this.repo.findSuccessfulByApplicant(
				input.applicantId
			);
			if (existingSuccess) {
				return {
					success: false,
					error: 'Application fee already paid',
					isDuplicate: true,
				};
			}

			const clientReference = generateClientReference(input.applicantId);

			const transaction = await this.repo.create({
				applicantId: input.applicantId,
				amount: input.amount.toString(),
				mobileNumber: input.mobileNumber,
				provider: input.provider,
				status: 'pending',
				clientReference,
			});

			if (input.provider === 'mpesa') {
				const response = await initiateMpesaPayment(
					input.amount,
					input.mobileNumber,
					clientReference
				);

				console.log('MPESA RESPONSE', response);

				if (isPaymentSuccessful(response)) {
					await this.repo.updateStatus(
						transaction.id,
						'pending',
						response.reference,
						response
					);
					return {
						success: true,
						transactionId: transaction.id,
						reference: response.reference,
						message: 'USSD prompt sent to your phone. Enter PIN to authorize.',
					};
				}

				await this.repo.updateStatus(
					transaction.id,
					'failed',
					undefined,
					response
				);
				return {
					success: false,
					error: response.message,
					transactionId: transaction.id,
				};
			}

			return {
				success: false,
				error: 'Ecocash is not available at this time',
			};
		}, ['registry', 'marketing', 'admin', 'applicant']);
	}

	async verifyPayment(transactionId: string) {
		return withAuth(async () => {
			const transaction = await this.repo.findByIdWithRelations(transactionId);
			if (!transaction) {
				throw new Error('Transaction not found');
			}

			if (transaction.status === 'success') {
				return { success: true, status: 'success' as TransactionStatus };
			}

			if (transaction.status === 'failed') {
				return { success: false, status: 'failed' as TransactionStatus };
			}

			if (!transaction.providerReference) {
				return { success: false, status: 'pending' as TransactionStatus };
			}

			const response = await verifyTransaction(transaction.providerReference);

			if (isPaymentSuccessful(response)) {
				await this.repo.updateStatus(
					transactionId,
					'success',
					response.transaction_id || transaction.providerReference,
					response
				);

				const receiptNumber = `APPLY-${transaction.applicantId}-${Date.now()}`;
				await db
					.update(paymentTransactions)
					.set({ receiptNumber })
					.where(eq(paymentTransactions.id, transactionId));

				const application = await db.query.applications.findFirst({
					where: eq(applications.applicantId, transaction.applicantId),
				});

				if (application) {
					await db
						.update(applications)
						.set({ paymentStatus: 'paid' })
						.where(eq(applications.id, application.id));
				}

				return { success: true, status: 'success' as TransactionStatus };
			}

			return { success: false, status: 'pending' as TransactionStatus };
		}, ['registry', 'marketing', 'admin', 'applicant']);
	}

	async markAsPaid(transactionId: string, manualReference: string) {
		return withAuth(
			async (session) => {
				const transaction =
					await this.repo.findByIdWithRelations(transactionId);
				if (!transaction) {
					throw new Error('Transaction not found');
				}

				const receiptNumber = `APPLY-${transaction.applicantId}-${Date.now()}`;

				const updated = await this.repo.markAsPaidManually(
					transactionId,
					manualReference,
					session?.user?.id || '',
					receiptNumber
				);

				const application = await db.query.applications.findFirst({
					where: eq(applications.applicantId, transaction.applicantId),
				});

				if (application) {
					await db
						.update(applications)
						.set({ paymentStatus: 'paid' })
						.where(eq(applications.id, application.id));
				}

				return updated;
			},
			['registry', 'marketing', 'admin']
		);
	}

	async getByApplicant(applicantId: string) {
		return withAuth(
			async () => this.repo.findByApplicant(applicantId),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async getPendingByApplicant(applicantId: string) {
		return withAuth(
			async () => this.repo.findPendingByApplicant(applicantId),
			['registry', 'marketing', 'admin', 'applicant']
		);
	}

	async countByStatus(status: TransactionStatus) {
		return withAuth(
			async () => this.repo.countByStatus(status),
			['registry', 'marketing', 'admin']
		);
	}
}

export const paymentsService = serviceWrapper(PaymentService, 'PaymentService');
