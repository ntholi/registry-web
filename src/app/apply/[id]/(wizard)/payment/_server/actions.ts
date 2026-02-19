'use server';

import { resolveApplicationFee } from '@admissions/_lib/fees';
import { getApplicant } from '@admissions/applicants';
import { getApplicationForPayment } from '@admissions/applications';
import {
	getBankDepositsByApplication,
	initiateMobilePayment,
	verifyMobilePayment,
} from '@admissions/payments';
import { extractError } from '@apply/_lib/errors';
import { bankDeposits, db, documents } from '@/core/database';
import { validateAnalyzedReceipt, validateReceipts } from './validation';

export { validateAnalyzedReceipt, validateReceipts };

const MAX_FILE_SIZE = 2 * 1024 * 1024;

type DepositData = {
	base64: string;
	mediaType: string;
	reference: string;
	beneficiaryName?: string | null;
	dateDeposited?: string | null;
	amountDeposited?: number | null;
	currency?: string | null;
	depositorName?: string | null;
	bankName?: string | null;
	transactionNumber?: string | null;
	terminalNumber?: string | null;
};

export async function submitReceiptPayment(
	applicationId: string,
	receipts: DepositData[]
): Promise<{ success: boolean; error?: string }> {
	try {
		for (const receipt of receipts) {
			const base64Size = Math.ceil((receipt.base64.length * 3) / 4);
			if (base64Size > MAX_FILE_SIZE) {
				return {
					success: false,
					error: 'Receipt file size exceeds 2MB limit',
				};
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
			return {
				success: false,
				error: allErrors.join('; '),
			};
		}

		await db.transaction(async (tx) => {
			for (const receipt of receipts) {
				const [doc] = await tx
					.insert(documents)
					.values({
						fileName: `deposit-${receipt.reference}.${receipt.mediaType.split('/')[1] || 'pdf'}`,
						fileUrl: `data:${receipt.mediaType};base64,${receipt.base64}`,
						type: 'proof_of_payment',
					})
					.returning({ id: documents.id });

				await tx.insert(bankDeposits).values({
					applicationId,
					documentId: doc.id,
					reference: receipt.reference,
					status: 'pending',
					beneficiaryName: receipt.beneficiaryName,
					dateDeposited: receipt.dateDeposited,
					amountDeposited: receipt.amountDeposited?.toString(),
					currency: receipt.currency,
					depositorName: receipt.depositorName,
					bankName: receipt.bankName,
					transactionNumber: receipt.transactionNumber,
					terminalNumber: receipt.terminalNumber,
				});
			}
		});

		return { success: true };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}

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
	const isMosotho = application.applicant?.isMosotho ?? null;
	const fee = intake ? resolveApplicationFee(intake, isMosotho) : null;

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

export async function initiateMpesaPayment(
	applicationId: string,
	amount: number,
	mobileNumber: string
) {
	try {
		return await initiateMobilePayment(
			applicationId,
			amount,
			mobileNumber,
			'mpesa'
		);
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}

export async function checkPaymentStatus(depositId: string) {
	try {
		return await verifyMobilePayment(depositId);
	} catch (error) {
		return { success: false, error: extractError(error), status: 'failed' };
	}
}
