'use server';

import { google } from '@ai-sdk/google';
import { generateText, NoObjectGeneratedError, Output } from 'ai';
import { z } from 'zod';

const model = google('gemini-2.5-flash-lite');

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

export type IdentityDocumentResult = z.infer<typeof identitySchema>;
export type CertificateDocumentResult = z.infer<typeof academicSchema>;
export type OtherDocumentResult = z.infer<typeof otherSchema>;

export type DocumentAnalysisResult =
	| ({ category: 'identity' } & IdentityDocumentResult)
	| ({ category: 'academic' } & CertificateDocumentResult)
	| ({ category: 'other' } & OtherDocumentResult);

const SYSTEM_PROMPT = `You are a document analysis expert specializing in extracting structured data from identity documents, academic certificates, and other official documents. You have expertise in recognizing document formats from Southern African countries (Lesotho, South Africa, Botswana, etc.) and international standards.`;

const ANALYSIS_PROMPT = `Analyze this document and extract information.

CATEGORIES:
- identity: IDs, passports, birth certificates
- academic: Certificates, transcripts, result slips
- other: Receipts, statements, medical reports

RULES:
- Dates: YYYY-MM-DD format
- institutionName: Student's school (not examining body like Cambridge/ECoL)
- COSC grades: Extract NUMERIC value (e.g., "C(c SIX)" → "6")
- LGCSE/IGCSE grades: Use letter (A*, A, B, C, D, E, F, G, U)
- Extract ALL subjects with grades
- Use null for missing/illegible data`;

export async function analyzeDocument(
	fileBase64: string,
	mediaType: string
): Promise<DocumentAnalysisResult> {
	try {
		const { output } = await generateText({
			model,
			system: SYSTEM_PROMPT,
			output: Output.object({
				schema: documentAnalysisSchema,
				name: 'DocumentAnalysis',
				description:
					'Extracted data from identity, academic, or other documents',
			}),
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: ANALYSIS_PROMPT },
						{ type: 'file', data: fileBase64, mediaType },
					],
				},
			],
		});

		if (!output) {
			throw new Error('Failed to analyze document: no output generated');
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
	} catch (error) {
		if (NoObjectGeneratedError.isInstance(error)) {
			console.error('Document analysis failed:', {
				cause: error.cause,
				text: error.text,
			});
			throw new Error(
				`Failed to extract structured data from document: ${error.cause}`
			);
		}
		throw error;
	}
}
