'use server';

import { resolveApplicationFee } from '@admissions/_lib/fees';
import { getApplication } from '@admissions/applications';
import { eq } from 'drizzle-orm';
import { applicants, db, intakePeriods } from '@/core/database';
import {
	analyzeReceipt,
	type ReceiptResult,
} from '@/core/integrations/ai/documents';

const BENEFICIARY_NAME = 'Limkokwing University of Creative Technology';
const BENEFICIARY_VARIATIONS = [
	'limkokwing university of creative technology',
	'limkokwing university',
	'luct',
	'limkokwing',
];

const SALES_RECEIPT_ISSUERS = [
	'limkokwing university of creative technology',
	'limkokwing university',
	'luct',
	'limkokwing',
];

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
		reference: string | null;
		amount: number;
		dateDeposited: string | null;
		isValid: boolean;
		errors: string[];
	}>;
};

function validateBeneficiary(beneficiaryName: string | null): {
	valid: boolean;
	error?: string;
} {
	if (!beneficiaryName) {
		return { valid: false, error: 'Beneficiary name not found on receipt' };
	}

	const normalizedName = beneficiaryName.toLowerCase().trim();
	const isValid = BENEFICIARY_VARIATIONS.some(
		(variation) =>
			normalizedName.includes(variation) || variation.includes(normalizedName)
	);

	if (!isValid) {
		return {
			valid: false,
			error: `Deposit must be made to "${BENEFICIARY_NAME}". Found: "${beneficiaryName}"`,
		};
	}
	return { valid: true };
}

function validateReference(reference: string | null): {
	valid: boolean;
	error?: string;
} {
	if (!reference) {
		return { valid: false, error: 'Reference number not found on receipt' };
	}
	return { valid: true };
}

function validateSalesReceiptIssuer(issuerName: string | null): {
	valid: boolean;
	error?: string;
} {
	if (!issuerName) {
		return { valid: false, error: 'Issuer name not found on sales receipt' };
	}

	const normalized = issuerName.toLowerCase().trim();
	const isValid = SALES_RECEIPT_ISSUERS.some(
		(variation) =>
			normalized.includes(variation) || variation.includes(normalized)
	);

	if (!isValid) {
		return {
			valid: false,
			error: `Sales receipt must be issued by Limkokwing University. Found: "${issuerName}"`,
		};
	}
	return { valid: true };
}

export async function validateAnalyzedReceipt(
	analysis: ReceiptResult
): Promise<ReceiptValidation> {
	const errors: string[] = [];

	const isSalesReceipt = analysis.receiptType === 'sales_receipt';

	if (!isSalesReceipt && !analysis.isBankDeposit) {
		errors.push(
			'This does not appear to be a bank deposit slip or university sales receipt'
		);
	}

	if (isSalesReceipt) {
		const issuerValidation = validateSalesReceiptIssuer(
			analysis.beneficiaryName
		);
		if (!issuerValidation.valid && issuerValidation.error) {
			errors.push(issuerValidation.error);
		}

		if (!analysis.receiptNumber && !analysis.reference) {
			errors.push('Receipt number not found on sales receipt');
		}
	} else {
		const beneficiaryValidation = validateBeneficiary(analysis.beneficiaryName);
		if (!beneficiaryValidation.valid && beneficiaryValidation.error) {
			errors.push(beneficiaryValidation.error);
		}

		const referenceValidation = validateReference(analysis.reference);
		if (!referenceValidation.valid && referenceValidation.error) {
			errors.push(referenceValidation.error);
		}
	}

	if (analysis.amountDeposited === null || analysis.amountDeposited <= 0) {
		errors.push('Could not extract a valid amount from the receipt');
	}

	return {
		isValid: errors.length === 0,
		errors,
		data: analysis,
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

	const applicant = await db.query.applicants.findFirst({
		where: eq(applicants.id, application.applicantId),
		columns: { nationality: true },
	});

	const requiredAmount = parseFloat(
		resolveApplicationFee(intake, applicant?.nationality ?? null)
	);
	const validatedReceipts: ReceiptsValidationResult['receipts'] = [];
	const globalErrors: string[] = [];
	let totalAmount = 0;

	for (const receipt of receipts) {
		const analysisResult = await analyzeReceipt(
			receipt.base64,
			receipt.mediaType
		);

		if (!analysisResult.success) {
			validatedReceipts.push({
				reference: null,
				amount: 0,
				dateDeposited: null,
				isValid: false,
				errors: [analysisResult.error],
			});
			continue;
		}

		const validation = await validateAnalyzedReceipt(analysisResult.data);

		const amount = validation.data?.amountDeposited ?? 0;
		totalAmount += amount;

		validatedReceipts.push({
			reference: validation.data?.reference ?? null,
			amount,
			dateDeposited: validation.data?.dateDeposited ?? null,
			isValid: validation.isValid,
			errors: validation.errors,
		});
	}

	if (totalAmount < requiredAmount) {
		globalErrors.push(
			`Total amount (M ${totalAmount.toFixed(
				2
			)}) is less than required fee (M ${requiredAmount.toFixed(2)})`
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
