'use server';

import { getApplicant } from '@admissions/applicants';
import { getApplication } from '@admissions/applications';
import {
	getPaymentsByApplication,
	getPendingPayment,
	initiatePayment,
	verifyPayment,
} from '@admissions/payments';
import { eq } from 'drizzle-orm';
import {
	applications,
	bankDeposits,
	db,
	documents,
	intakePeriods,
} from '@/core/database';
import { validateReceipts, validateSingleReceipt } from './validation';

export { validateSingleReceipt, validateReceipts };

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

		await tx
			.update(applications)
			.set({ paymentStatus: 'paid', updatedAt: new Date() })
			.where(eq(applications.id, applicationId));
	});

	return { success: true };
}

export async function getPaymentPageData(applicationId: string) {
	const application = await getApplication(applicationId);

	if (!application?.applicantId) {
		return {
			applicant: null,
			application: null,
			fee: null,
			transactions: [],
			isPaid: false,
			pendingTransaction: null,
			intakeStartDate: null,
			intakeEndDate: null,
		};
	}

	const [applicant, transactions, pendingTransaction] = await Promise.all([
		getApplicant(application.applicantId),
		getPaymentsByApplication(applicationId),
		getPendingPayment(applicationId),
	]);

	const intake = await db.query.intakePeriods.findFirst({
		where: eq(intakePeriods.id, application.intakePeriodId),
	});

	const successfulPayment = transactions.find(
		(t: { status: string }) => t.status === 'success'
	);

	return {
		applicant,
		application,
		fee: intake?.applicationFee || null,
		transactions,
		isPaid: !!successfulPayment || application.paymentStatus === 'paid',
		pendingTransaction,
		intakeStartDate: intake?.startDate || null,
		intakeEndDate: intake?.endDate || null,
	};
}

export async function initiateMpesaPayment(
	applicationId: string,
	amount: number,
	mobileNumber: string
) {
	return initiatePayment({
		applicationId,
		amount,
		mobileNumber,
		provider: 'mpesa',
	});
}

export async function checkPaymentStatus(transactionId: string) {
	return verifyPayment(transactionId);
}

export async function getApplicationPendingPayment(applicationId: string) {
	return getPendingPayment(applicationId);
}
