import { eq } from 'drizzle-orm';
import {
	hasOwnedStudentSession,
	isStudentSession,
} from '@/core/auth/sessionPermissions';
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

class PaymentReceiptService extends BaseService<typeof paymentReceipts, 'id'> {
	constructor() {
		super(new PaymentReceiptRepository(), {
			byIdAuth: async (session) => isStudentSession(session),
			findAllAuth: async (session) => isStudentSession(session),
			createAuth: async (session) => isStudentSession(session),
			updateAuth: async (session) => isStudentSession(session),
			deleteAuth: async (session) => isStudentSession(session),
			countAuth: async (session) => isStudentSession(session),
			activityTypes: {
				create: 'payment_receipt_added',
				delete: 'payment_receipt_removed',
			},
		});
	}

	private getStudentStdNo(
		session: { user?: { stdNo?: number | null } } | null
	) {
		return session?.user?.stdNo ?? null;
	}

	override async create(data: PaymentReceipt) {
		return withPermission(
			async (session) => {
				const audit = this.buildAuditOptions(session, 'create');
				if (audit && data.stdNo) audit.stdNo = data.stdNo;
				return this.repository.create(data, audit);
			},
			async (session) => isStudentSession(session)
		);
	}

	async getByGraduationRequest(graduationRequestId: number) {
		return withPermission(
			async () => {
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
			},
			async (session) => isStudentSession(session)
		);
	}

	async createMany(data: PaymentReceipt[]) {
		return withPermission(
			async (session) => {
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
			},
			async (session) => isStudentSession(session)
		);
	}

	async updateGraduationPaymentReceipts(
		graduationRequestId: number,
		receipts: PaymentReceiptData[],
		stdNo: number
	) {
		return withPermission(
			async (session) => {
				if (!session?.user?.stdNo) {
					throw new Error('User not authenticated');
				}

				return db.transaction(async (tx) => {
					const graduationRequest = await tx.query.graduationRequests.findFirst(
						{
							where: (table, { eq }) => eq(table.id, graduationRequestId),
							with: {
								studentProgram: true,
							},
						}
					);

					if (
						!graduationRequest ||
						!hasOwnedStudentSession(
							session,
							graduationRequest.studentProgram.stdNo
						)
					) {
						throw new Error('Graduation request not found or access denied');
					}

					const existingLinks =
						await tx.query.graduationRequestReceipts.findMany({
							where: eq(
								graduationRequestReceipts.graduationRequestId,
								graduationRequestId
							),
							with: { receipt: true },
						});

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
			},
			async (session) => isStudentSession(session)
		);
	}

	async addPaymentReceipt(
		graduationRequestId: number,
		receipt: PaymentReceiptData
	) {
		return withPermission(
			async (session) => {
				const studentStdNo = this.getStudentStdNo(session);
				if (!studentStdNo) {
					throw new Error('User not authenticated');
				}

				return db.transaction(async (tx) => {
					const graduationRequest = await tx.query.graduationRequests.findFirst(
						{
							where: (table, { eq }) => eq(table.id, graduationRequestId),
							with: {
								studentProgram: true,
							},
						}
					);

					if (
						!graduationRequest ||
						!hasOwnedStudentSession(
							session,
							graduationRequest.studentProgram.stdNo
						)
					) {
						throw new Error('Graduation request not found or access denied');
					}

					const [newReceipt] = await tx
						.insert(paymentReceipts)
						.values({
							receiptNo: receipt.receiptNo,
							receiptType: receipt.receiptType,
							stdNo: studentStdNo,
						})
						.returning();

					await tx.insert(graduationRequestReceipts).values({
						graduationRequestId: graduationRequestId,
						receiptId: newReceipt.id,
					});

					return newReceipt;
				});
			},
			async (session) => isStudentSession(session)
		);
	}

	async removePaymentReceipt(receiptId: string) {
		return withPermission(
			async (session) => {
				if (!session?.user?.stdNo) {
					throw new Error('User not authenticated');
				}

				return db.transaction(async (tx) => {
					const receipt = await tx.query.paymentReceipts.findFirst({
						where: eq(paymentReceipts.id, receiptId),
					});

					if (!receipt || !hasOwnedStudentSession(session, receipt.stdNo)) {
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
			},
			async (session) => isStudentSession(session)
		);
	}
}

export const paymentReceiptService = serviceWrapper(
	PaymentReceiptService,
	'PaymentReceipt'
);
