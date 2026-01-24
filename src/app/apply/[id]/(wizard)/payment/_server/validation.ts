'use server';

import { getApplication } from '@admissions/applications';
import { eq } from 'drizzle-orm';
import { db, intakePeriods } from '@/core/database';
import {
	analyzeReceipt,
	type ReceiptResult,
} from '@/core/integrations/ai/documents';

export type ReceiptValidation = {
	isValid: boolean;
	errors: string[];
	data: ReceiptResult | null;
};

export type ReceiptsValidationResult = {
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
