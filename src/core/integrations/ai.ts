'use server';

import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';

const model = google('gemini-2.5-flash-preview-05-20');

const identityDocumentSchema = z.object({
	documentType: z
		.enum(['identity', 'passport_photo', 'other'])
		.describe(
			'The type of document detected. Use "identity" for national IDs, passports, driver licenses'
		),
	fullName: z.string().nullable().describe('Full name of the person'),
	dateOfBirth: z
		.string()
		.nullable()
		.describe('Date of birth in YYYY-MM-DD format'),
	nationalId: z
		.string()
		.nullable()
		.describe('National ID number, passport number, or similar identifier'),
	nationality: z
		.string()
		.nullable()
		.describe('Nationality or country of citizenship'),
	gender: z
		.enum(['Male', 'Female'])
		.nullable()
		.describe('Gender if visible on document'),
	birthPlace: z.string().nullable().describe('Place of birth if available'),
	address: z.string().nullable().describe('Address if available on document'),
	expiryDate: z
		.string()
		.nullable()
		.describe('Document expiry date in YYYY-MM-DD format if available'),
});

const certificateDocumentSchema = z.object({
	documentType: z
		.enum([
			'certificate',
			'transcript',
			'academic_record',
			'recommendation_letter',
			'other',
		])
		.describe(
			'The type of academic document detected. Use "certificate" for diplomas/certificates, "transcript" for grade sheets, "academic_record" for result slips'
		),
	institutionName: z
		.string()
		.nullable()
		.describe('Name of the educational institution'),
	qualificationName: z
		.string()
		.nullable()
		.describe('Name of qualification or program'),
	examYear: z.number().nullable().describe('Year of examination/graduation'),
	certificateType: z
		.string()
		.nullable()
		.describe(
			'Type of certificate (e.g., LGCSE, COSC, IGCSE, A-Level, Diploma, Degree)'
		),
	subjects: z
		.array(
			z.object({
				name: z.string().describe('Subject name'),
				grade: z
					.string()
					.describe('Grade obtained (e.g., A, B, C, D, E, F, or numeric)'),
			})
		)
		.nullable()
		.describe('List of subjects and grades if visible'),
	overallClassification: z
		.enum(['Distinction', 'Merit', 'Credit', 'Pass', 'Fail'])
		.nullable()
		.describe('Overall result classification if applicable'),
	studentName: z
		.string()
		.nullable()
		.describe('Name of the student on the certificate'),
});

const otherDocumentSchema = z.object({
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
});

export type IdentityDocumentResult = z.infer<typeof identityDocumentSchema>;
export type CertificateDocumentResult = z.infer<
	typeof certificateDocumentSchema
>;
export type OtherDocumentResult = z.infer<typeof otherDocumentSchema>;

export type DocumentAnalysisResult =
	| ({ category: 'identity' } & IdentityDocumentResult)
	| ({ category: 'academic' } & CertificateDocumentResult)
	| ({ category: 'other' } & OtherDocumentResult);

const documentCategorySchema = z.object({
	category: z
		.enum(['identity', 'academic', 'other'])
		.describe(
			'Category of document: "identity" for IDs/passports, "academic" for certificates/transcripts, "other" for everything else'
		),
});

export async function analyzeDocument(
	fileBase64: string,
	mediaType: string
): Promise<DocumentAnalysisResult> {
	const { output: categoryResult } = await generateText({
		model,
		output: Output.object({ schema: documentCategorySchema }),
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: `Analyze this document and determine its category. Is it:
- "identity": A national ID, passport, driver license, or any government-issued identification document
- "academic": A certificate, diploma, transcript, result slip, or any educational document
- "other": Any other type of document (payment receipts, letters, medical reports, etc.)

Only respond with the category.`,
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

	const category = categoryResult?.category;

	if (category === 'identity') {
		const { output } = await generateText({
			model,
			output: Output.object({ schema: identityDocumentSchema }),
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: `This is an identity document. Extract all available information.
- For dates, use YYYY-MM-DD format
- For national ID numbers, include the full number exactly as shown
- For nationality, use the country name (e.g., "Lesotho", "South Africa")
- If information is not visible or unclear, return null for that field`,
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
		return { category: 'identity', ...output! };
	}

	if (category === 'academic') {
		const { output } = await generateText({
			model,
			output: Output.object({ schema: certificateDocumentSchema }),
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: `This is an academic document. Extract all available information.
- For certificateType, identify if it's LGCSE, COSC, IGCSE, A-Level, Diploma, Bachelor's Degree, etc.
- For subjects, extract all subject names and their corresponding grades
- For examYear, extract the year of examination/graduation
- If overall classification exists (Distinction/Merit/Credit/Pass/Fail), include it
- If information is not visible or unclear, return null for that field`,
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
		return { category: 'academic', ...output! };
	}

	const { output } = await generateText({
		model,
		output: Output.object({ schema: otherDocumentSchema }),
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: `This document doesn't appear to be an ID or academic certificate. 
Identify what type of document it is and provide a brief description.
Document types: proof_of_payment, personal_statement, medical_report, enrollment_letter, clearance_form, other`,
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
	return { category: 'other', ...output! };
}
