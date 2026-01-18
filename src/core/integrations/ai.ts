'use server';

import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';

const model = google('gemini-2.5-flash-lite');

const documentAnalysisSchema = z.object({
	category: z
		.enum(['identity', 'academic', 'other'])
		.describe(
			'Document category: "identity" for IDs/passports, "academic" for certificates/transcripts, "other" for other documents'
		),
	identity: z
		.object({
			documentType: z
				.enum(['identity', 'passport_photo', 'other'])
				.describe('The type of identity document'),
			fullName: z.string().nullable().describe('Full name of the person'),
			dateOfBirth: z
				.string()
				.nullable()
				.describe('Date of birth in YYYY-MM-DD format'),
			nationalId: z
				.string()
				.nullable()
				.describe('National ID, passport number, or similar identifier'),
			nationality: z
				.string()
				.nullable()
				.describe('Nationality or country of citizenship'),
			gender: z.enum(['Male', 'Female']).nullable().describe('Gender'),
			birthPlace: z.string().nullable().describe('Place of birth'),
			address: z.string().nullable().describe('Address if available'),
			expiryDate: z
				.string()
				.nullable()
				.describe('Document expiry date in YYYY-MM-DD format'),
		})
		.nullable()
		.describe('Populated only when category is "identity"'),
	academic: z
		.object({
			documentType: z
				.enum([
					'certificate',
					'transcript',
					'academic_record',
					'recommendation_letter',
					'other',
				])
				.describe('Type of academic document'),
			institutionName: z
				.string()
				.nullable()
				.describe('Name of the educational institution'),
			qualificationName: z
				.string()
				.nullable()
				.describe('Name of qualification or program'),
			examYear: z
				.number()
				.nullable()
				.describe('Year of examination/graduation'),
			certificateType: z
				.string()
				.nullable()
				.describe(
					'Type of certificate (LGCSE, COSC, IGCSE, A-Level, Diploma, Degree)'
				),
			subjects: z
				.array(
					z.object({
						name: z.string().describe('Subject name'),
						grade: z.string().describe('Grade obtained'),
					})
				)
				.nullable()
				.describe('List of subjects and grades'),
			overallClassification: z
				.enum(['Distinction', 'Merit', 'Credit', 'Pass', 'Fail'])
				.nullable()
				.describe('Overall result classification'),
			studentName: z
				.string()
				.nullable()
				.describe('Name of the student on the certificate'),
		})
		.nullable()
		.describe('Populated only when category is "academic"'),
	other: z
		.object({
			documentType: z
				.enum([
					'proof_of_payment',
					'personal_statement',
					'medical_report',
					'enrollment_letter',
					'clearance_form',
					'other',
				])
				.describe('The detected document type'),
			description: z
				.string()
				.nullable()
				.describe('Brief description of the document content'),
		})
		.nullable()
		.describe('Populated only when category is "other"'),
});

type DocumentAnalysisOutput = z.infer<typeof documentAnalysisSchema>;

export type IdentityDocumentResult = NonNullable<
	DocumentAnalysisOutput['identity']
>;
export type CertificateDocumentResult = NonNullable<
	DocumentAnalysisOutput['academic']
>;
export type OtherDocumentResult = NonNullable<DocumentAnalysisOutput['other']>;

export type DocumentAnalysisResult =
	| ({ category: 'identity' } & IdentityDocumentResult)
	| ({ category: 'academic' } & CertificateDocumentResult)
	| ({ category: 'other' } & OtherDocumentResult);

export async function analyzeDocument(
	fileBase64: string,
	mediaType: string
): Promise<DocumentAnalysisResult> {
	const { output } = await generateText({
		model,
		output: Output.object({ schema: documentAnalysisSchema }),
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: `Analyze this document and extract all relevant information in a single pass.

1. First, determine the document CATEGORY:
   - "identity": National IDs, passports, driver licenses, government-issued identification
   - "academic": Certificates, diplomas, transcripts, result slips, educational documents
   - "other": Payment receipts, letters, medical reports, other documents

2. Based on the category, populate ONLY the corresponding field with extracted data:
   - If category is "identity", populate the "identity" field and leave "academic" and "other" as null
   - If category is "academic", populate the "academic" field and leave "identity" and "other" as null
   - If category is "other", populate the "other" field and leave "identity" and "academic" as null

EXTRACTION GUIDELINES:
- For dates, use YYYY-MM-DD format
- For national IDs, include the full number exactly as shown
- For nationality, use country name (e.g., "Lesotho", "South Africa")
- For certificateType, identify: LGCSE, COSC, IGCSE, A-Level, Diploma, Bachelor's Degree, etc.
- For subjects, extract all visible subject names with their grades
- If information is unclear or not visible, use null`,
					},
					{
						type: 'file',
						data: fileBase64,
						mediaType,
					},
				],
			},
		],
	});

	if (!output) {
		throw new Error('Failed to analyze document');
	}

	const { category, identity, academic, other } = output;

	if (category === 'identity' && identity) {
		return { category: 'identity', ...identity };
	}

	if (category === 'academic' && academic) {
		return { category: 'academic', ...academic };
	}

	if (other) {
		return { category: 'other', ...other };
	}

	return {
		category: 'other',
		documentType: 'other',
		description: 'Unable to classify document',
	};
}
