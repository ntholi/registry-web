'use server';
import { resolveApplicationFee } from '@admissions/_lib/fees';
import { getApplicant } from '@admissions/applicants';
import { getApplicationForPayment } from '@admissions/applications';
import {
	getBankDepositsByApplication,
	initiateMobilePayment,
	verifyMobilePayment,
} from '@admissions/payments';
import { MAX_FILE_SIZE } from '@apply/_lib/constants';
import { nanoid } from 'nanoid';
import { bankDeposits, db, documents } from '@/core/database';
import { deleteFile, uploadFile } from '@/core/integrations/storage';
import { StoragePaths } from '@/core/integrations/storage-utils';
import { createAction, unwrap } from '@/shared/lib/actions/actionResult';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import { validateAnalyzedReceipt, validateReceipts } from './validation';

export { validateAnalyzedReceipt, validateReceipts };

type DepositData = {
	base64: string;
	mediaType: string;
	reference: string;
	receiptType?: 'bank_deposit' | 'sales_receipt';
	receiptNumber?: string | null;
	beneficiaryName?: string | null;
	dateDeposited?: string | null;
	amountDeposited?: number | null;
	currency?: string | null;
	depositorName?: string | null;
	bankName?: string | null;
	paymentMode?: string | null;
	transactionNumber?: string | null;
	terminalNumber?: string | null;
};

type MpesaPaymentResult =
	| {
			isDuplicate: true;
			message?: string;
	  }
	| {
			isDuplicate: false;
			transactionId: string;
			clientReference?: string;
			message?: string;
	  };

type PaymentStatusResult =
	| { status: 'success' }
	| { status: 'failed'; error?: string }
	| { status: 'pending' };

export const submitReceiptPayment = createAction(
	async (applicationId: string, receipts: DepositData[]) => {
		for (const receipt of receipts) {
			const base64Size = Math.ceil((receipt.base64.length * 3) / 4);
			if (base64Size > MAX_FILE_SIZE) {
				throw new UserFacingError('Receipt file size exceeds 2MB limit');
			}
		}

		const validation = await validateReceipts(
			applicationId,
			receipts.map((r) => ({ base64: r.base64, mediaType: r.mediaType }))
		);

		if (!validation.success) {
			const allErrors = [
				...validation.errors,
				...validation.receipts.flatMap((r) => r.errors),
			];
			throw new UserFacingError(
				allErrors.join('; ') || 'Failed to validate receipt upload'
			);
		}

		const uploaded: { key: string; docId: string; receipt: DepositData }[] = [];
		try {
			for (const receipt of receipts) {
				const ext = receipt.mediaType.split('/')[1] || 'pdf';
				const buffer = Buffer.from(receipt.base64, 'base64');
				const docId = nanoid();
				const key = StoragePaths.admissionDeposit(
					applicationId,
					`${docId}.${ext}`
				);
				await uploadFile(buffer, key, receipt.mediaType);
				uploaded.push({ key, docId, receipt });
			}

			await db.transaction(async (tx) => {
				for (const { key, docId, receipt } of uploaded) {
					const ext = receipt.mediaType.split('/')[1] || 'pdf';
					const [doc] = await tx
						.insert(documents)
						.values({
							id: docId,
							fileName: `deposit-${receipt.reference}.${ext}`,
							fileUrl: key,
							type: 'proof_of_payment',
						})
						.returning({ id: documents.id });

					await tx.insert(bankDeposits).values({
						applicationId,
						documentId: doc.id,
						reference: receipt.reference,
						type: receipt.receiptType ?? 'bank_deposit',
						status: 'pending',
						receiptNumber: receipt.receiptNumber,
						beneficiaryName: receipt.beneficiaryName,
						dateDeposited: receipt.dateDeposited,
						amountDeposited: receipt.amountDeposited?.toString(),
						currency: receipt.currency,
						depositorName: receipt.depositorName,
						bankName: receipt.bankName,
						paymentMode: receipt.paymentMode,
						transactionNumber: receipt.transactionNumber,
						terminalNumber: receipt.terminalNumber,
					});
				}
			});
		} catch (uploadOrDbError) {
			for (const { key } of uploaded) {
				try {
					await deleteFile(key);
				} catch {
					console.error(`Failed to clean up orphaned R2 object: ${key}`);
				}
			}
			throw uploadOrDbError;
		}
	}
);

export async function getPaymentPageData(applicationId: string) {
	const application = await getApplicationForPayment(applicationId);

	if (!application?.applicantId) {
		return {
			applicant: null,
			application: null,
			fee: null,
			bankDeposits: [],
			isPaid: false,
			hasPendingDeposit: false,
			intakeStartDate: null,
			intakeEndDate: null,
		};
	}

	const [applicant, deposits] = await Promise.all([
		getApplicant(application.applicantId),
		getBankDepositsByApplication(applicationId),
	]);

	const verifiedDeposit = deposits?.find(
		(d: { status: string }) => d.status === 'verified'
	);
	const pendingDeposit = deposits?.find(
		(d: { status: string }) => d.status === 'pending'
	);

	const intake = application.intakePeriod;
	const nationality = application.applicant?.nationality ?? null;
	const fee = intake ? resolveApplicationFee(intake, nationality) : null;

	return {
		applicant,
		application,
		fee,
		bankDeposits: deposits ?? [],
		isPaid: !!verifiedDeposit || application.paymentStatus === 'paid',
		hasPendingDeposit: !!pendingDeposit,
		intakeStartDate: intake?.startDate ?? null,
		intakeEndDate: intake?.endDate ?? null,
	};
}

export const initiateMpesaPayment = createAction(
	async (
		applicationId: string,
		amount: number,
		mobileNumber: string
	): Promise<MpesaPaymentResult> => {
		const result = unwrap(
			await initiateMobilePayment(applicationId, amount, mobileNumber, 'mpesa')
		);

		if (result.isDuplicate) {
			return {
				isDuplicate: true,
				message: result.error,
			};
		}

		if (!result.success || !result.transactionId) {
			throw new UserFacingError(result.error || 'Payment initiation failed');
		}

		return {
			isDuplicate: false,
			transactionId: result.transactionId,
			clientReference: result.clientReference,
			message: result.message,
		};
	}
);

export const checkPaymentStatus = createAction(
	async (depositId: string): Promise<PaymentStatusResult> => {
		const result = unwrap(await verifyMobilePayment(depositId));
		if (result.status === 'success') {
			return { status: 'success' };
		}
		if (result.status === 'failed') {
			return { status: 'failed', error: result.error };
		}
		return { status: 'pending' };
	}
);
