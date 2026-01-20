'use server';

import { google } from '@ai-sdk/google';
import { generateText, NoObjectGeneratedError, Output } from 'ai';
import type { z } from 'zod';
import {
	academicSchema,
	documentAnalysisSchema,
	identitySchema,
	type otherSchema,
} from './schemas';

const model = google('gemini-2.5-flash');

export type IdentityDocumentResult = z.infer<typeof identitySchema>;
export type CertificateDocumentResult = z.infer<typeof academicSchema>;
export type OtherDocumentResult = z.infer<typeof otherSchema>;

export type DocumentAnalysisResult =
	| ({ category: 'identity' } & IdentityDocumentResult)
	| ({ category: 'academic' } & CertificateDocumentResult)
	| ({ category: 'other' } & OtherDocumentResult);

const SYSTEM_PROMPT = `You are a document analysis expert specializing in extracting structured data from identity documents, 
academic certificates, and other official documents. You have expertise in recognizing document formats from Southern African 
countries (Lesotho, South Africa, Botswana, etc.) and international standards.`;

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

const IDENTITY_PROMPT = `Analyze this identity document and extract structured information.

RULES:
- Dates: YYYY-MM-DD format
- Use null for missing/illegible data`;

const ACADEMIC_PROMPT = `Analyze this academic document and extract structured information.

RULES:
- Dates: YYYY-MM-DD format
- institutionName: Student's school (not examining body like Cambridge/ECoL)
- COSC grades: Extract NUMERIC value (e.g., "C(c SIX)" → "6")
- LGCSE/IGCSE grades: Use letter (A*, A, B, C, D, E, F, G, U)
- Extract ALL subjects with grades
- Return certificateName and lqfLevel using the system certificate type naming and LQF levels
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

export async function analyzeIdentityDocument(
	fileBase64: string,
	mediaType: string
): Promise<IdentityDocumentResult> {
	try {
		const { output } = await generateText({
			model,
			system: SYSTEM_PROMPT,
			output: Output.object({
				schema: identitySchema,
				name: 'IdentityDocument',
				description: 'Extracted data from identity documents',
			}),
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: IDENTITY_PROMPT },
						{ type: 'file', data: fileBase64, mediaType },
					],
				},
			],
		});

		if (!output) {
			throw new Error(
				'Failed to analyze identity document: no output generated'
			);
		}

		return output;
	} catch (error) {
		if (NoObjectGeneratedError.isInstance(error)) {
			console.error('Identity document analysis failed:', {
				cause: error.cause,
				text: error.text,
			});
			throw new Error(
				`Failed to extract structured data from identity document: ${error.cause}`
			);
		}
		throw error;
	}
}

export async function analyzeAcademicDocument(
	fileBase64: string,
	mediaType: string
): Promise<CertificateDocumentResult> {
	try {
		const { output } = await generateText({
			model,
			system: SYSTEM_PROMPT,
			output: Output.object({
				schema: academicSchema,
				name: 'AcademicDocument',
				description: 'Extracted data from academic documents',
			}),
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: ACADEMIC_PROMPT },
						{ type: 'file', data: fileBase64, mediaType },
					],
				},
			],
		});

		if (!output) {
			throw new Error(
				'Failed to analyze academic document: no output generated'
			);
		}

		return output;
	} catch (error) {
		if (NoObjectGeneratedError.isInstance(error)) {
			console.error('Academic document analysis failed:', {
				cause: error.cause,
				text: error.text,
			});
			throw new Error(
				`Failed to extract structured data from academic document: ${error.cause}`
			);
		}
		throw error;
	}
}
