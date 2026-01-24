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
import { applications, db, intakePeriods } from '@/core/database';
import {
	analyzeReceipt,
	type ReceiptResult,
} from '@/core/integrations/ai/documents';

type ReceiptValidation = {
	isValid: boolean;
	errors: string[];
	data: ReceiptResult | null;
};

type ReceiptsValidationResult = {
	success: boolean;
	errors: string[];
	totalAmount: number;
	requiredAmount: number;
	receipts: Array<{
		receiptNumber: string | null;
		amount: number;
		dateIssued: string | null;
		isValid: boolean;
		errors: string[];
	}>;
};

function validateReceiptNumber(receiptNumber: string | null): {
	valid: boolean;
	error?: string;
} {
	if (!receiptNumber) {
		return { valid: false, error: 'Receipt number not found' };
	}
	const pattern = /^SR-\d{5}$/;
	if (!pattern.test(receiptNumber)) {
		return {
			valid: false,
			error: `Invalid receipt number format: ${receiptNumber}. Expected SR-XXXXX (e.g., SR-53657)`,
		};
	}
	return { valid: true };
}

function validateReceiptDate(
	dateIssued: string | null,
	intakeStartDate: string,
	intakeEndDate: string
): { valid: boolean; error?: string } {
	if (!dateIssued) {
		return { valid: false, error: 'Receipt date not found' };
	}
	const receiptDate = new Date(dateIssued);
	const startDate = new Date(intakeStartDate);
	const endDate = new Date(intakeEndDate);

	if (receiptDate < startDate || receiptDate > endDate) {
		return {
			valid: false,
			error: `Receipt date ${dateIssued} is outside the intake period (${intakeStartDate} to ${intakeEndDate})`,
		};
	}
	return { valid: true };
}

export async function validateSingleReceipt(
	fileBase64: string,
	mediaType: string,
	intakeStartDate: string,
	intakeEndDate: string
): Promise<ReceiptValidation> {
	const errors: string[] = [];

	const data = await analyzeReceipt(fileBase64, mediaType);

	if (!data.isLimkokwingReceipt) {
		errors.push(
			'This does not appear to be an official Limkokwing University receipt'
		);
	}

	const numberValidation = validateReceiptNumber(data.receiptNumber);
	if (!numberValidation.valid && numberValidation.error) {
		errors.push(numberValidation.error);
	}

	const dateValidation = validateReceiptDate(
		data.dateIssued,
		intakeStartDate,
		intakeEndDate
	);
	if (!dateValidation.valid && dateValidation.error) {
		errors.push(dateValidation.error);
	}

	if (data.amountPaid === null || data.amountPaid <= 0) {
		errors.push('Could not extract a valid payment amount from the receipt');
	}

	return {
		isValid: errors.length === 0,
		errors,
		data,
	};
}

export async function validateReceipts(
	applicationId: string,
	receipts: Array<{ base64: string; mediaType: string }>
): Promise<ReceiptsValidationResult> {
	const application = await getApplication(applicationId);
	if (!application) {
		return {
			success: false,
			errors: ['Application not found'],
			totalAmount: 0,
			requiredAmount: 0,
			receipts: [],
		};
	}

	const intake = await db.query.intakePeriods.findFirst({
		where: eq(intakePeriods.id, application.intakePeriodId),
	});

	if (!intake) {
		return {
			success: false,
			errors: ['Intake period not found'],
			totalAmount: 0,
			requiredAmount: 0,
			receipts: [],
		};
	}

	const requiredAmount = parseFloat(intake.applicationFee);
	const validatedReceipts: ReceiptsValidationResult['receipts'] = [];
	const globalErrors: string[] = [];
	let totalAmount = 0;

	for (const receipt of receipts) {
		const validation = await validateSingleReceipt(
			receipt.base64,
			receipt.mediaType,
			intake.startDate,
			intake.endDate
		);

		const amount = validation.data?.amountPaid ?? 0;
		totalAmount += amount;

		validatedReceipts.push({
			receiptNumber: validation.data?.receiptNumber ?? null,
			amount,
			dateIssued: validation.data?.dateIssued ?? null,
			isValid: validation.isValid,
			errors: validation.errors,
		});
	}

	if (totalAmount < requiredAmount) {
		globalErrors.push(
			`Total amount (M ${totalAmount.toFixed(2)}) is less than required fee (M ${requiredAmount.toFixed(2)})`
		);
	}

	const allReceiptsValid = validatedReceipts.every((r) => r.isValid);

	return {
		success: allReceiptsValid && totalAmount >= requiredAmount,
		errors: globalErrors,
		totalAmount,
		requiredAmount,
		receipts: validatedReceipts,
	};
}

export async function submitReceiptPayment(
	applicationId: string,
	receipts: Array<{ base64: string; mediaType: string; receiptNumber: string }>
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

	await db
		.update(applications)
		.set({ paymentStatus: 'paid', updatedAt: new Date() })
		.where(eq(applications.id, applicationId));

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
