'use server';

import { getCertificateTypeByName } from '@admissions/certificate-types/_server/actions';
import { google } from '@ai-sdk/google';
import { NoObjectGeneratedError, Output, generateText } from 'ai';
import type { z } from 'zod';
import {
	academicSchema,
	type certificationSchema,
	documentAnalysisSchema,
	identitySchema,
	type otherSchema,
	receiptSchema,
} from './schemas';

const model = google('gemini-3-flash-preview');

export type IdentityDocumentResult = z.infer<typeof identitySchema>;
export type CertificateDocumentResult = z.infer<typeof academicSchema>;
export type OtherDocumentResult = z.infer<typeof otherSchema>;
export type ReceiptResult = z.infer<typeof receiptSchema>;
export type CertificationResult = z.infer<typeof certificationSchema>;

export type AnalysisResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

export type DocumentAnalysisResult =
	| ({ category: 'identity' } & IdentityDocumentResult)
	| ({ category: 'academic' } & CertificateDocumentResult)
	| ({ category: 'other' } & OtherDocumentResult);

const SYSTEM_PROMPT =
	'You are a document analysis expert specializing in extracting structured data from identity documents, academic certificates, and other official documents. You have expertise in recognizing document formats from Southern African countries (Lesotho, South Africa, Botswana, etc.) and international standards.';

const COMMON_RULES = `- Dates: YYYY-MM-DD format
- Use null for missing/illegible data`;

const CERTIFICATION_RULES = `CERTIFICATION:
- isCertified: true if document shows any official certification (stamp, seal, or official mark)`;

const ANALYSIS_PROMPT = `Analyze this document and extract information.

CATEGORIES:
- identity: IDs, passports, birth certificates  
- academic: Certificates, transcripts, result slips
- other: Receipts, statements, medical reports

RULES:
${COMMON_RULES}
- institutionName: Student's school (not examining body like Cambridge/ECoL)
- COSC grades: Extract NUMERIC value (e.g., "C(c SIX)" → "6")
- LGCSE/IGCSE grades: Use letter (A*, A, B, C, D, E, F, G, U)
- Extract ALL subjects with grades

GRADE ACCURACY (CRITICAL - FOR ACADEMIC DOCUMENTS):
- For each subject, provide a confidence score (0-100) for the grade reading.
- 100 = absolutely certain the grade is correct
- 95-99 = very confident, minor image quality issues
- <95 = uncertain, add subject name to "unreadableGrades" list
- If confidence < 95 for ANY subject, you MUST add that subject to "unreadableGrades".
- DO NOT guess grades. Accuracy is more important than completeness.

${CERTIFICATION_RULES}`;

const IDENTITY_PROMPT = `Analyze this identity document and extract structured information.

RULES:
${COMMON_RULES}

${CERTIFICATION_RULES}`;

const ACADEMIC_PROMPT = `Analyze this academic document and extract structured information.

RULES:
${COMMON_RULES}
- institutionName: Student's school (not examining body like Cambridge/ECoL)
- COSC grades: Extract NUMERIC value (e.g., "C(c SIX)" → "6")
- LGCSE/IGCSE grades: Use letter (A*, A, B, C, D, E, F, G, U)
- Extract ALL subjects with grades

GRADE ACCURACY (CRITICAL - ZERO TOLERANCE FOR ERRORS):
- For EACH subject, you MUST provide a confidence score (0-100) for the grade reading.
- 100 = absolutely certain, crystal clear, no doubt whatsoever
- 95-99 = very confident, minor image quality issues but grade is distinguishable
- <95 = uncertain, ambiguous, blurry, or could be misread

MANDATORY RULES:
1. If confidence < 95 for ANY subject, you MUST add that subject name to "unreadableGrades".
2. DO NOT guess grades. If "B" could be "D" or "8", that is <95 confidence.
3. If the document is blurry, faded, or partially obscured, report ALL affected subjects.
4. It is BETTER to report a grade as unreadable than to guess incorrectly.
5. Example: "Mathematics" grade looks like "B" but might be "D" → confidence: 70, add "Mathematics" to "unreadableGrades".

ISSUING AUTHORITY:
- issuingAuthority: Extract examining body (ECoL, Cambridge, IEB, Umalusi)
- "Examinations Council of Lesotho" → record as "ECoL"

${CERTIFICATION_RULES}`;

const DEFAULT_CERTIFICATE_TYPES = [
	'LGCSE',
	'COSC',
	'NSC',
	'IGCSE',
	'GCE O-Level',
	'GCE AS Level',
	'GCE A-Level',
	'Certificate',
	'Diploma',
	'Degree',
];

export async function analyzeDocument(
	fileBase64: string,
	mediaType: string,
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
			if (academic.unreadableGrades && academic.unreadableGrades.length > 0) {
				throw new Error(
					`Unable to read grades for: ${academic.unreadableGrades.join(
						', ',
					)}. Please upload a clearer image.`,
				);
			}
			const lowConfidenceSubjects =
				academic.subjects
					?.filter((s) => s.confidence < 95)
					.map((s) => s.name) ?? [];
			if (lowConfidenceSubjects.length > 0) {
				throw new Error(
					`Uncertain grade readings for: ${lowConfidenceSubjects.join(
						', ',
					)}. Please upload a clearer image.`,
				);
			}
			return { category: 'academic', ...academic };
		}

		if (other) {
			return { category: 'other', ...other };
		}

		return {
			category: 'other',
			documentType: 'other',
			description: 'Unable to classify document',
			certification: null,
		};
	} catch (error) {
		if (NoObjectGeneratedError.isInstance(error)) {
			console.error('Document analysis failed:', {
				cause: error.cause,
				text: error.text,
			});
			throw new Error(
				`Failed to extract structured data from document: ${error.cause}`,
			);
		}
		throw error;
	}
}

export async function analyzeIdentityDocument(
	fileBase64: string,
	mediaType: string,
): Promise<AnalysisResult<IdentityDocumentResult>> {
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
			return {
				success: false,
				error: 'Failed to analyze identity document: no output generated',
			};
		}

		if (output.documentType === 'other') {
			return { success: false, error: 'Invalid identity document' };
		}

		const missing: string[] = [];
		if (!output.fullName) missing.push('name');
		if (!output.nationalId) missing.push('ID number');
		if (!output.dateOfBirth) missing.push('date of birth');
		if (!output.gender) missing.push('gender');

		if (missing.length > 0) {
			return {
				success: false,
				error: `Invalid identity document: missing ${missing.join(', ')}`,
			};
		}

		return { success: true, data: output };
	} catch (error) {
		if (NoObjectGeneratedError.isInstance(error)) {
			console.error('Identity document analysis failed:', {
				cause: error.cause,
				text: error.text,
			});
			return {
				success: false,
				error: `Failed to extract structured data from identity document: ${error.cause}`,
			};
		}
		return {
			success: false,
			error:
				error instanceof Error ? error.message : 'An unexpected error occurred',
		};
	}
}

type CertificateTypeInput = string | { name: string; lqfLevel: number | null };

function normalizeCertificateTypes(
	types: CertificateTypeInput[] | undefined,
): Array<{ name: string; lqfLevel: number | null }> {
	if (!types)
		return DEFAULT_CERTIFICATE_TYPES.map((t) => ({ name: t, lqfLevel: null }));
	return types.map((t) =>
		typeof t === 'string' ? { name: t, lqfLevel: null } : t,
	);
}

export async function analyzeAcademicDocument(
	fileBase64: string,
	mediaType: string,
	certificateTypes?: CertificateTypeInput[],
	applicantName?: string,
): Promise<AnalysisResult<CertificateDocumentResult>> {
	const types = normalizeCertificateTypes(certificateTypes);
	const typeList = types
		.map((t) => `  - ${t.name}${t.lqfLevel ? ` (LQF ${t.lqfLevel})` : ''}`)
		.join('\n');

	const nameInstruction = applicantName
		? `\n\nNAME VERIFICATION:\nThe expected applicant name is: "${applicantName}"
Compare this with the student name on the document and set nameMatchConfidence (0-100).

IMPORTANT: Names can appear in different formats but still belong to the same person:
- Different order: "Thabo Lebese" = "Lebese Thabo"
- With/without middle names: "Thabo Lebese" = "Thabo David Lebese"
- Combined variations: "Thabo Lebese" = "Lebese Thabo David"

Scoring guide:
- 100: Names are identical
- 90-99: Same person - names share all key parts (first name + surname match, possibly different order or extra middle name)
- 80-89: Very likely same person - minor OCR/spelling variations (1-2 characters different)
- 50-79: Uncertain - some parts match but significant differences
- 0-49: Different people - no clear match`
		: '';

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
						{
							type: 'text',
							text: `${ACADEMIC_PROMPT}\n\nCERTIFICATE TYPES (use exact name and corresponding lqfLevel):\n${typeList}${nameInstruction}`,
						},
						{ type: 'file', data: fileBase64, mediaType },
					],
				},
			],
		});

		if (!output) {
			return {
				success: false,
				error: 'Failed to analyze academic document: no output generated',
			};
		}

		if (output.documentType === 'other') {
			return { success: false, error: 'Invalid academic document' };
		}

		if (output.unreadableGrades && output.unreadableGrades.length > 0) {
			return {
				success: false,
				error: `Unable to read grades for: ${output.unreadableGrades.join(
					', ',
				)}. Please upload a clearer image.`,
			};
		}

		const lowConfidenceSubjects =
			output.subjects?.filter((s) => s.confidence < 95).map((s) => s.name) ??
			[];
		if (lowConfidenceSubjects.length > 0) {
			return {
				success: false,
				error: `Uncertain grade readings for: ${lowConfidenceSubjects.join(
					', ',
				)}. Please upload a clearer image.`,
			};
		}

		if (
			output.documentType === 'certificate' &&
			(!output.certificateType ||
				!types.some((t) => t.name === output.certificateType))
		) {
			return {
				success: false,
				error: `Invalid certificate type: ${output.certificateType}`,
			};
		}

		if (!output.certification?.isCertified) {
			return { success: false, error: 'Document must be certified' };
		}

		if (applicantName && output.nameMatchConfidence !== null) {
			if (output.nameMatchConfidence < 80) {
				return {
					success: false,
					error: `Name mismatch: document belongs to "${output.studentName}", not "${applicantName}"`,
				};
			}
		}

		if (output.documentType === 'certificate' && output.certificateType) {
			const dbCertType = await getCertificateTypeByName(output.certificateType);

			if (!dbCertType) {
				return {
					success: false,
					error: `Certificate type "${output.certificateType}" is not recognized. Only certificates registered in the system are accepted.`,
				};
			}

			const isEcol =
				output.issuingAuthority?.toLowerCase().includes('ecol') ||
				output.issuingAuthority
					?.toLowerCase()
					.includes('examinations council of lesotho');

			if (dbCertType.lqfLevel === 4 && !isEcol) {
				return {
					success: false,
					error:
						'LQF Level 4 certificates and result slips must be issued by the Examinations Council of Lesotho (ECoL).',
				};
			}
		}

		return { success: true, data: output };
	} catch (error) {
		if (NoObjectGeneratedError.isInstance(error)) {
			console.error('Academic document analysis failed:', {
				cause: error.cause,
				text: error.text,
			});
			return {
				success: false,
				error: `Failed to extract structured data from academic document: ${error.cause}`,
			};
		}
		return {
			success: false,
			error:
				error instanceof Error ? error.message : 'An unexpected error occurred',
		};
	}
}

const RECEIPT_PROMPT = `Analyze this bank deposit slip or proof of payment document.

RULES:
${COMMON_RULES}
- Beneficiary: Extract account holder name exactly as shown
- Reference: Bank reference number or transaction ID
- Amount: Numeric value only (no currency symbols)
- isBankDeposit: true if this is a bank deposit slip to "Limkokwing University of Creative Technology"`;

export async function analyzeReceipt(
	fileBase64: string,
	mediaType: string,
): Promise<ReceiptResult> {
	try {
		const { output } = await generateText({
			model,
			system: SYSTEM_PROMPT,
			output: Output.object({
				schema: receiptSchema,
				name: 'Receipt',
				description: 'Extracted data from payment receipt',
			}),
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: RECEIPT_PROMPT },
						{ type: 'file', data: fileBase64, mediaType },
					],
				},
			],
		});

		if (!output) {
			throw new Error('Failed to analyze receipt: no output generated');
		}

		return output;
	} catch (error) {
		if (NoObjectGeneratedError.isInstance(error)) {
			console.error('Receipt analysis failed:', {
				cause: error.cause,
				text: error.text,
			});
			throw new Error(
				`Failed to extract structured data from receipt: ${error.cause}`,
			);
		}
		throw error;
	}
}
