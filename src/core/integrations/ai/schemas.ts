import { z } from 'zod';
import { normalizeResultClassification } from '@/shared/lib/utils/resultClassification';

const gradeConfidenceMin = 99;
const lgcseIgcseGrades = new Set([
	'A*',
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'U',
]);

const edexcelIgcseGrades = new Set([
	'9',
	'8',
	'7',
	'6',
	'5',
	'4',
	'3',
	'2',
	'1',
	'U',
]);

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
	confidence: z
		.number()
		.min(0)
		.max(100)
		.describe(
			'Overall confidence level (0-100) in the accuracy of extraction. 100 = absolutely certain, <100 = uncertain/blurry.'
		),
});

const academicSchema = z
	.object({
		documentType: z
			.enum([
				'certificate',
				'academic_record',
				'recommendation_letter',
				'other',
			])
			.describe(
				'Academic document classification: certificate (formal credential upon completion) or academic_record (results slips, transcripts, statements of results, verification letters, equivalence letters)'
			),
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
				'Certificate standard: LGCSE, COSC, IGCSE, Edexcel IGCSE, NSC, GCE O-Level, GCE AS Level, GCE A-Level, Certificate, Diploma, Degree'
			),
		qualificationName: z
			.string()
			.nullable()
			.describe(
				'Full title of the qualification for diplomas/degrees (e.g., "Diploma in Tourism Management", "BA in Tourism Management"). Only applicable for diploma, degree, or certificate completion documents.'
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
		isEcol: z
			.boolean()
			.describe(
				'Whether the document somehow includes the Examinations Council of Lesotho (ECoL) in the document'
			),
		isCambridge: z
			.boolean()
			.describe(
				'Whether the document is issued by Cambridge Assessment International Education (Cambridge, CAIE, CIE, or UCLES)'
			),
		isPearson: z
			.boolean()
			.describe('Whether the document is issued by Pearson/Edexcel'),
		subjects: z
			.array(
				z.object({
					name: z.string().describe('Subject/course name'),
					grade: z
						.string()
						.describe(
							'Grade value as shown. LGCSE/IGCSE: A*, A, B, C, D, E, F, G, or U. Edexcel IGCSE: 9, 8, 7, 6, 5, 4, 3, 2, 1, or U.'
						),
					confidence: z
						.number()
						.min(0)
						.max(100)
						.describe(
							`Confidence level (0-100) in the accuracy of this grade reading. 100 = absolutely certain, <${gradeConfidenceMin} = uncertain.`
						),
				})
			)
			.nullable()
			.describe('Individual subject results with confidence scores'),
		unreadableGrades: z
			.array(z.string())
			.nullable()
			.describe(
				`List of subject names where the grade symbol is not clearly legible or uncertain (confidence < ${gradeConfidenceMin}).`
			),
		overallClassification: z
			.string()
			.nullable()
			.refine(
				(value) =>
					value === null || normalizeResultClassification(value) !== null,
				{
					message:
						'Invalid classification. Use Distinction, Merit (or Marit), Credit, Pass, Fail, First Class (A/B), Second Class (Upper/Lower/A/B), or Third Class (A/B).',
				}
			)
			.transform((value) => normalizeResultClassification(value))
			.describe('Overall qualification grade classification'),
		certificateNumber: z
			.string()
			.nullable()
			.describe('Certificate or serial number on the document'),
		candidateNumber: z
			.string()
			.nullable()
			.describe(
				'Candidate number if present (e.g., Centre/Candidate Number or Center/Cand. No.)'
			),
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
	})
	.superRefine((value, ctx) => {
		const subjects = value.subjects ?? [];
		const certificateType = value.certificateType?.toLowerCase() ?? '';
		const isCompletionCertificate =
			certificateType.includes('diploma') ||
			certificateType.includes('degree') ||
			(certificateType === 'certificate' &&
				!certificateType.includes('lgcse') &&
				!certificateType.includes('igcse') &&
				!certificateType.includes('nsc') &&
				!certificateType.includes('cosc') &&
				!certificateType.includes('gce'));
		const needsSubjects =
			(value.documentType === 'certificate' && !isCompletionCertificate) ||
			value.documentType === 'academic_record';

		if (needsSubjects && subjects.length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['subjects'],
				message: 'Subjects are required for academic results documents.',
			});
		}

		const lowConfidence = subjects
			.filter((subject) => subject.confidence < gradeConfidenceMin)
			.map((subject) => subject.name);
		if (lowConfidence.length > 0) {
			const unreadable = new Set(value.unreadableGrades ?? []);
			for (const subjectName of lowConfidence) {
				if (!unreadable.has(subjectName)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['unreadableGrades'],
						message: `Unreadable grades must include: ${subjectName}.`,
					});
				}
			}
		}

		const isEdexcelIgcse = certificateType.includes('edexcel');
		const isLgcseIgcse =
			certificateType.includes('lgcse') ||
			(certificateType.includes('igcse') && !isEdexcelIgcse);
		for (const subject of subjects) {
			const grade = subject.grade.trim().toUpperCase();
			if (isEdexcelIgcse && !edexcelIgcseGrades.has(grade)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['subjects'],
					message: `Edexcel IGCSE grades must be 9, 8, 7, 6, 5, 4, 3, 2, 1, or U. Invalid grade for ${subject.name}.`,
				});
			}
			if (isLgcseIgcse && !lgcseIgcseGrades.has(grade)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['subjects'],
					message: `LGCSE/IGCSE grades must be A*, A, B, C, D, E, F, G, or U. Invalid grade for ${subject.name}.`,
				});
			}
		}
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
	receiptType: z
		.enum(['bank_deposit', 'sales_receipt', 'unknown'])
		.describe(
			'Type of receipt: bank_deposit (bank deposit slip), sales_receipt (university-issued sales receipt), unknown (unrecognizable)'
		),
	isBankDeposit: z
		.boolean()
		.describe('Whether this is a bank deposit slip or proof of payment'),
	receiptNumber: z
		.string()
		.nullable()
		.describe(
			'Sales receipt number (e.g., SR-19046) for university-issued receipts'
		),
	beneficiaryName: z
		.string()
		.nullable()
		.describe(
			'For bank deposits: account holder name. For sales receipts: the issuing organization name'
		),
	reference: z
		.string()
		.nullable()
		.describe(
			'For bank deposits: bank reference/transaction ID. For sales receipts: the receipt number (SR-xxxxx)'
		),
	dateDeposited: z
		.string()
		.nullable()
		.describe('Date of deposit or receipt in YYYY-MM-DD format'),
	amountDeposited: z
		.number()
		.nullable()
		.describe('Total amount paid/deposited as shown on the receipt'),
	currency: z
		.string()
		.nullable()
		.describe('Currency code (e.g., LSL, ZAR, USD)'),
	depositorName: z
		.string()
		.nullable()
		.describe(
			'For bank deposits: person who made the deposit. For sales receipts: the reference name / person the receipt is issued to'
		),
	bankName: z
		.string()
		.nullable()
		.describe('Name of the bank where the deposit was made'),
	paymentMode: z
		.string()
		.nullable()
		.describe(
			'Payment method shown on receipt (e.g., Bank Remittance, Cash, EFT)'
		),
	transactionNumber: z
		.string()
		.nullable()
		.describe('Transaction number if different from reference'),
	terminalNumber: z
		.string()
		.nullable()
		.describe('Terminal or teller ID number'),
	accountNumber: z
		.string()
		.nullable()
		.describe(
			'Beneficiary/destination bank account number the deposit was made to'
		),
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
	gradeConfidenceMin,
	documentAnalysisSchema,
	identitySchema,
	academicSchema,
	otherSchema,
	receiptSchema,
	certificationSchema,
};
