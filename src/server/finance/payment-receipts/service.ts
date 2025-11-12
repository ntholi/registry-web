import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { paymentReceipts, type paymentType } from '@/db/schema';
import withAuth from '@/server/base/withAuth';
import type { QueryOptions } from '../../base/BaseRepository';
import { serviceWrapper } from '../../base/serviceWrapper';
import PaymentReceiptRepository from './repository';

type PaymentReceipt = typeof paymentReceipts.$inferInsert;

type PaymentReceiptData = {
	paymentType: (typeof paymentType.enumValues)[number];
	receiptNo: string;
};

class PaymentReceiptService {
	constructor(private readonly repository = new PaymentReceiptRepository()) {}

	async get(id: number) {
		return withAuth(async () => this.repository.findById(id), ['student']);
	}

	async getAll(params: QueryOptions<typeof paymentReceipts>) {
		return withAuth(async () => this.repository.query(params), ['student']);
	}

	async getByGraduationRequest(graduationRequestId: number) {
		return withAuth(async () => {
			return db.query.paymentReceipts.findMany({
				where: eq(paymentReceipts.graduationRequestId, graduationRequestId),
			});
		}, ['student']);
	}

	async create(data: PaymentReceipt) {
		return withAuth(async () => this.repository.create(data), ['student']);
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

	async update(id: number, data: Partial<PaymentReceipt>) {
		return withAuth(async () => this.repository.update(id, data), ['student']);
	}

	async delete(id: number) {
		return withAuth(async () => this.repository.delete(id), ['student']);
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
				// First, verify that the graduation request belongs to the authenticated user
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

				// Delete existing payment receipts
				await tx
					.delete(paymentReceipts)
					.where(eq(paymentReceipts.graduationRequestId, graduationRequestId));

				// Insert new payment receipts
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
				// Verify that the graduation request belongs to the authenticated user
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
				// First, verify that the receipt belongs to a graduation request of the authenticated user
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
