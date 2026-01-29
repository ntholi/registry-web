import { z } from 'zod';

const certificationSchema = z.object({
	isCertified: z
		.boolean()
		.describe(
			'Whether the document has visible certification (stamp, seal, or official mark)'
		),
});

const identitySchema = z.object({
	documentType: z
		.enum(['identity', 'passport_photo', 'other'])
		.describe('Type: identity card, passport photo, or other ID document'),
	fullName: z
		.string()
		.nullable()
		.describe('Complete legal name as shown on document'),
	dateOfBirth: z
		.string()
		.nullable()
		.describe('Birth date in YYYY-MM-DD format'),
	nationalId: z
		.string()
		.nullable()
		.describe('Government-issued ID number (passport, national ID)'),
	nationality: z
		.string()
		.nullable()
		.describe('Country of citizenship (e.g., Lesotho, South Africa)'),
	gender: z
		.enum(['Male', 'Female'])
		.nullable()
		.describe('Biological sex as stated on document'),
	birthPlace: z.string().nullable().describe('City/town of birth'),
	address: z.string().nullable().describe('Residential address if visible'),
	expiryDate: z
		.string()
		.nullable()
		.describe('Document expiration in YYYY-MM-DD format'),
	certification: certificationSchema
		.nullable()
		.describe('Certification details if document is certified'),
});

const academicSchema = z.object({
	documentType: z
		.enum([
			'certificate',
			'transcript',
			'academic_record',
			'recommendation_letter',
			'other',
		])
		.describe('Academic document classification'),
	institutionName: z
		.string()
		.nullable()
		.describe('Full name of school, college, or university'),
	examYear: z
		.number()
		.nullable()
		.describe('Year examination was completed (4-digit)'),
	certificateType: z
		.string()
		.nullable()
		.describe(
			'Certificate standard: LGCSE, COSC, IGCSE, A-Level, Diploma, Degree'
		),
	lqfLevel: z
		.number()
		.nullable()
		.describe('LQF level associated with the certificate type'),
	issuingAuthority: z
		.string()
		.nullable()
		.describe(
			'Examining body or issuing authority (e.g., ECoL, Cambridge, IEB, Umalusi)'
		),
	subjects: z
		.array(
			z.object({
				name: z.string().describe('Subject/course name'),
				grade: z
					.string()
					.describe(
						'Grade value: for COSC use numeric (1-9), for LGCSE/IGCSE use letter (A*-U)'
					),
			})
		)
		.nullable()
		.describe('Individual subject results'),
	unreadableGrades: z
		.array(z.string())
		.nullable()
		.describe(
			'List of subject names where the grade symbol is not clearly legible or uncertain.'
		),
	overallClassification: z
		.enum(['Distinction', 'Merit', 'Credit', 'Pass', 'Fail'])
		.nullable()
		.describe('Overall qualification grade classification'),
	certificateNumber: z
		.string()
		.nullable()
		.describe('Certificate or serial number on the document'),
	studentName: z
		.string()
		.nullable()
		.describe('Student name appearing on document'),
	nameMatchConfidence: z
		.number()
		.min(0)
		.max(100)
		.nullable()
		.describe(
			'Confidence (0-100) that the student name matches the expected applicant name. Only set when expectedName is provided.'
		),
	certification: certificationSchema
		.nullable()
		.describe('Certification details if document is certified'),
});

const otherSchema = z.object({
	documentType: z
		.enum([
			'proof_of_payment',
			'personal_statement',
			'medical_report',
			'enrollment_letter',
			'clearance_form',
			'other',
		])
		.describe('Type of supporting document'),
	description: z
		.string()
		.nullable()
		.describe('Summary of document purpose and content'),
	certification: certificationSchema
		.nullable()
		.describe('Certification details if document is certified'),
});

const receiptSchema = z.object({
	isBankDeposit: z
		.boolean()
		.describe('Whether this is a bank deposit slip or proof of payment'),
	beneficiaryName: z
		.string()
		.nullable()
		.describe(
			'Name of the account holder/beneficiary the money was deposited to'
		),
	reference: z
		.string()
		.nullable()
		.describe('Bank reference number or transaction ID'),
	dateDeposited: z
		.string()
		.nullable()
		.describe('Date the deposit was made in YYYY-MM-DD format'),
	amountDeposited: z
		.number()
		.nullable()
		.describe('Total amount deposited as shown on the receipt'),
	currency: z
		.string()
		.nullable()
		.describe('Currency code (e.g., LSL, ZAR, USD)'),
	depositorName: z
		.string()
		.nullable()
		.describe('Name of the person who made the deposit'),
	bankName: z
		.string()
		.nullable()
		.describe('Name of the bank where the deposit was made'),
	transactionNumber: z
		.string()
		.nullable()
		.describe('Transaction number if different from reference'),
	terminalNumber: z
		.string()
		.nullable()
		.describe('Terminal or teller ID number'),
});

const documentAnalysisSchema = z.object({
	category: z
		.enum(['identity', 'academic', 'other'])
		.describe(
			'Primary classification: identity (IDs/passports), academic (certificates/transcripts), other'
		),
	identity: identitySchema
		.nullable()
		.describe('Identity document data - only when category is identity'),
	academic: academicSchema
		.nullable()
		.describe('Academic document data - only when category is academic'),
	other: otherSchema
		.nullable()
		.describe('Other document data - only when category is other'),
});

export {
	documentAnalysisSchema,
	identitySchema,
	academicSchema,
	otherSchema,
	receiptSchema,
	certificationSchema,
};
