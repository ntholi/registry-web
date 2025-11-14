import { eq } from 'drizzle-orm';
import { auth } from '@/core/auth';
import { db } from '@/core/database';
import { paymentReceipts, type paymentType } from '@/core/database/schema';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import PaymentReceiptRepository from './repository';

type PaymentReceipt = typeof paymentReceipts.$inferInsert;

type PaymentReceiptData = {
	paymentType: (typeof paymentType.enumValues)[number];
	receiptNo: string;
};

class PaymentReceiptService extends BaseService<typeof paymentReceipts, 'id'> {
	constructor() {
		super(new PaymentReceiptRepository(), {
			byIdRoles: ['student'],
			findAllRoles: ['student'],
			createRoles: ['student'],
			updateRoles: ['student'],
			deleteRoles: ['student'],
			countRoles: ['student'],
		});
	}

	async getByGraduationRequest(graduationRequestId: number) {
		return withAuth(async () => {
			return db.query.paymentReceipts.findMany({
				where: eq(paymentReceipts.graduationRequestId, graduationRequestId),
			});
		}, ['student']);
	}

	async createMany(data: PaymentReceipt[]) {
		return withAuth(async () => {
			const results = [];
			for (const receipt of data) {
				results.push(await this.repository.create(receipt));
			}
			return results;
		}, ['student']);
	}

	async updateGraduationPaymentReceipts(
		graduationRequestId: number,
		receipts: PaymentReceiptData[]
	) {
		return withAuth(async () => {
			const session = await auth();
			if (!session?.user?.stdNo) {
				throw new Error('User not authenticated');
			}

			return db.transaction(async (tx) => {
				const graduationRequest = await tx.query.graduationRequests.findFirst({
					where: (table, { eq }) => eq(table.id, graduationRequestId),
					with: {
						studentProgram: true,
					},
				});

				if (
					!graduationRequest ||
					graduationRequest.studentProgram.stdNo !== session.user!.stdNo
				) {
					throw new Error('Graduation request not found or access denied');
				}

				await tx
					.delete(paymentReceipts)
					.where(eq(paymentReceipts.graduationRequestId, graduationRequestId));

				if (receipts.length > 0) {
					const receiptValues = receipts.map((receipt) => ({
						...receipt,
						graduationRequestId: graduationRequestId,
					}));

					await tx.insert(paymentReceipts).values(receiptValues);
				}

				return { success: true };
			});
		}, ['student']);
	}

	async addPaymentReceipt(
		graduationRequestId: number,
		receipt: PaymentReceiptData
	) {
		return withAuth(async () => {
			const session = await auth();
			if (!session?.user?.stdNo) {
				throw new Error('User not authenticated');
			}

			return db.transaction(async (tx) => {
				const graduationRequest = await tx.query.graduationRequests.findFirst({
					where: (table, { eq }) => eq(table.id, graduationRequestId),
					with: {
						studentProgram: true,
					},
				});

				if (
					!graduationRequest ||
					graduationRequest.studentProgram.stdNo !== session.user!.stdNo
				) {
					throw new Error('Graduation request not found or access denied');
				}

				const [newReceipt] = await tx
					.insert(paymentReceipts)
					.values({
						...receipt,
						graduationRequestId: graduationRequestId,
					})
					.returning();

				return newReceipt;
			});
		}, ['student']);
	}

	async removePaymentReceipt(receiptId: number) {
		return withAuth(async () => {
			const session = await auth();
			if (!session?.user?.stdNo) {
				throw new Error('User not authenticated');
			}

			return db.transaction(async (tx) => {
				const receipt = await tx.query.paymentReceipts.findFirst({
					where: eq(paymentReceipts.id, receiptId),
					with: {
						graduationRequest: {
							with: {
								studentProgram: true,
							},
						},
					},
				});

				if (
					!receipt ||
					receipt.graduationRequest.studentProgram.stdNo !== session.user!.stdNo
				) {
					throw new Error('Payment receipt not found or access denied');
				}

				await tx
					.delete(paymentReceipts)
					.where(eq(paymentReceipts.id, receiptId));

				return { success: true };
			});
		}, ['student']);
	}
}

export const paymentReceiptService = serviceWrapper(
	PaymentReceiptService,
	'PaymentReceipt'
);
