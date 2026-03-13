import { eq } from 'drizzle-orm';
import type { Session } from '@/core/auth';
import {
	db,
	graduationRequestReceipts,
	paymentReceipts,
	type ReceiptType,
} from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import PaymentReceiptRepository from './repository';

type PaymentReceipt = typeof paymentReceipts.$inferInsert;

type PaymentReceiptData = {
	receiptType: ReceiptType;
	receiptNo: string;
};

async function isStudentSession(session: Session | null | undefined) {
	return session?.user?.role === 'student';
}

class PaymentReceiptService extends BaseService<typeof paymentReceipts, 'id'> {
	constructor() {
		super(new PaymentReceiptRepository(), {
			byIdAuth: isStudentSession,
			findAllAuth: isStudentSession,
			createAuth: isStudentSession,
			updateAuth: isStudentSession,
			deleteAuth: isStudentSession,
			countAuth: isStudentSession,
			activityTypes: {
				create: 'payment_receipt_added',
				delete: 'payment_receipt_removed',
			},
		});
	}

	override async create(data: PaymentReceipt) {
		return withPermission(async (session) => {
			const audit = this.buildAuditOptions(session, 'create');
			if (audit && data.stdNo) audit.stdNo = data.stdNo;
			return this.repository.create(data, audit);
		}, isStudentSession);
	}

	async getByGraduationRequest(graduationRequestId: number) {
		return withPermission(async () => {
			const links = await db.query.graduationRequestReceipts.findMany({
				where: eq(
					graduationRequestReceipts.graduationRequestId,
					graduationRequestId
				),
				with: {
					receipt: true,
				},
			});
			return links.map((link) => link.receipt);
		}, isStudentSession);
	}

	async createMany(data: PaymentReceipt[]) {
		return withPermission(async (session) => {
			const results = [];
			for (const receipt of data) {
				results.push(
					await this.repository.create(receipt, {
						userId: session!.user!.id!,
						role: session!.user!.role!,
						stdNo: receipt.stdNo,
					})
				);
			}
			return results;
		}, isStudentSession);
	}

	async updateGraduationPaymentReceipts(
		graduationRequestId: number,
		receipts: PaymentReceiptData[],
		stdNo: number
	) {
		return withPermission(async (session) => {
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

				const existingLinks = await tx.query.graduationRequestReceipts.findMany(
					{
						where: eq(
							graduationRequestReceipts.graduationRequestId,
							graduationRequestId
						),
						with: { receipt: true },
					}
				);

				for (const link of existingLinks) {
					await tx
						.delete(graduationRequestReceipts)
						.where(eq(graduationRequestReceipts.receiptId, link.receipt.id));
					await tx
						.delete(paymentReceipts)
						.where(eq(paymentReceipts.id, link.receipt.id));
				}

				for (const receipt of receipts) {
					const [newReceipt] = await tx
						.insert(paymentReceipts)
						.values({
							receiptNo: receipt.receiptNo,
							receiptType: receipt.receiptType,
							stdNo: stdNo,
						})
						.returning();

					await tx.insert(graduationRequestReceipts).values({
						graduationRequestId: graduationRequestId,
						receiptId: newReceipt.id,
					});
				}

				return { success: true };
			});
		}, isStudentSession);
	}

	async addPaymentReceipt(
		graduationRequestId: number,
		receipt: PaymentReceiptData
	) {
		return withPermission(async (session) => {
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
						receiptNo: receipt.receiptNo,
						receiptType: receipt.receiptType,
						stdNo: session.user!.stdNo,
					})
					.returning();

				await tx.insert(graduationRequestReceipts).values({
					graduationRequestId: graduationRequestId,
					receiptId: newReceipt.id,
				});

				return newReceipt;
			});
		}, isStudentSession);
	}

	async removePaymentReceipt(receiptId: string) {
		return withPermission(async (session) => {
			if (!session?.user?.stdNo) {
				throw new Error('User not authenticated');
			}

			return db.transaction(async (tx) => {
				const receipt = await tx.query.paymentReceipts.findFirst({
					where: eq(paymentReceipts.id, receiptId),
				});

				if (!receipt || receipt.stdNo !== session.user!.stdNo) {
					throw new Error('Payment receipt not found or access denied');
				}

				await tx
					.delete(graduationRequestReceipts)
					.where(eq(graduationRequestReceipts.receiptId, receiptId));

				await tx
					.delete(paymentReceipts)
					.where(eq(paymentReceipts.id, receiptId));

				return { success: true };
			});
		}, isStudentSession);
	}
}

export const paymentReceiptService = serviceWrapper(
	PaymentReceiptService,
	'PaymentReceipt'
);
