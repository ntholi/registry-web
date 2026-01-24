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
import { db, intakePeriods } from '@/core/database';

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
