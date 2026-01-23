'use server';

import { getApplicant } from '@admissions/applicants';
import { findApplicationsByApplicant } from '@admissions/applications';
import {
	getPaymentsByApplicant,
	getPendingPayment,
	initiatePayment,
	verifyPayment,
} from '@admissions/payments';
import { eq } from 'drizzle-orm';
import { db, intakePeriods } from '@/core/database';

export async function getPaymentPageData(applicantId: string) {
	const [applicant, applications, transactions] = await Promise.all([
		getApplicant(applicantId),
		findApplicationsByApplicant(applicantId),
		getPaymentsByApplicant(applicantId),
	]);

	const application = applications.find(
		(app: { status: string }) =>
			app.status === 'draft' || app.status === 'submitted'
	);

	if (!application) {
		return { applicant, application: null, fee: null, transactions };
	}

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
	};
}

export async function initiateMpesaPayment(
	applicantId: string,
	amount: number,
	mobileNumber: string
) {
	return initiatePayment({
		applicantId,
		amount,
		mobileNumber,
		provider: 'mpesa',
	});
}

export async function checkPaymentStatus(transactionId: string) {
	return verifyPayment(transactionId);
}

export async function getApplicantPendingPayment(applicantId: string) {
	return getPendingPayment(applicantId);
}
