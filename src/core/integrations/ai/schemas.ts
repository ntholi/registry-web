import { z } from 'zod';

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
	qualificationName: z
		.string()
		.nullable()
		.describe('Degree, diploma, or certificate title'),
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
	certificateName: z
		.string()
		.nullable()
		.describe('Certificate type name as used in the system'),
	lqfLevel: z
		.number()
		.nullable()
		.describe('LQF level associated with the certificate type'),
	subjects: z
		.array(
			z.object({
				name: z.string().describe('Subject/course name'),
				grade: z
					.string()
					.describe(
						'Grade value: for COSC use numeric (1-9), for LGCSE/IGCSE use letter (A-G)'
					),
			})
		)
		.nullable()
		.describe('Individual subject results'),
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
});

const receiptSchema = z.object({
	isLimkokwingReceipt: z
		.boolean()
		.describe('Whether this is an official Limkokwing University receipt'),
	receiptNumber: z
		.string()
		.nullable()
		.describe('Receipt number in SR-XXXXX format (e.g., SR-53657)'),
	dateIssued: z
		.string()
		.nullable()
		.describe('Date the receipt was issued in YYYY-MM-DD format'),
	amountPaid: z
		.number()
		.nullable()
		.describe('Total amount paid as shown on the receipt'),
	currency: z
		.string()
		.nullable()
		.describe('Currency code (e.g., LSL, ZAR, USD)'),
	payerName: z.string().nullable().describe('Name of the person who paid'),
	description: z
		.string()
		.nullable()
		.describe('Payment description or purpose as stated on receipt'),
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
};
