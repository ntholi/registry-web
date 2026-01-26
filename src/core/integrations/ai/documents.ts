'use server';

import { getCertificateTypeByName } from '@admissions/certificate-types/_server/actions';
import { google } from '@ai-sdk/google';
import { generateText, NoObjectGeneratedError, Output } from 'ai';
import type { z } from 'zod';
import { namesMatch } from '@/shared/lib/utils/utils';
import {
	academicSchema,
	type certificationSchema,
	documentAnalysisSchema,
	identitySchema,
	type otherSchema,
	receiptSchema,
} from './schemas';

const model = google('gemini-2.5-flash');

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
- Use null for missing/illegible data

CERTIFICATION EXTRACTION:
- A certified document MUST have BOTH a stamp AND a signature
- There might be multiple stamps on a document, IGNORE stamps from the examining body (ECoL, Cambridge, etc.) - these are part of the certificate itself
- Only consider certification stamps from Commissioner of Oaths, Notary Public, Justice of the Peace, etc.
- isCertified: true only if a THIRD-PARTY certification stamp AND signature are present
- hasStamp: true if official certification stamp/seal visible (NOT the examining body's stamp)
- hasSignature: true if handwritten signature present near the certification stamp
- certifiedDate: Extract date from certification stamp in YYYY-MM-DD format
- certifierName: Name from certification stamp (person or organization)
- certifierTitle: Title from stamp (Commissioner of Oaths, Notary Public, JP, etc.)`;

const IDENTITY_PROMPT = `Analyze this identity document and extract structured information.

RULES:
- Dates: YYYY-MM-DD format
- Use null for missing/illegible data

CERTIFICATION EXTRACTION:
- isCertified: true only if a NON-ECoL stamp AND signature are present
- hasStamp: true if any official stamp/seal visible
- hasSignature: true if handwritten signature present near stamp
- IMPORTANT: Extract ALL stamps visible on the document into the stamps array
- For each stamp extract: date (YYYY-MM-DD), name (person/organization), title (e.g., Commissioner of Oaths)
- For each stamp, set isEcol: true if it's from ECoL (Examinations Council of Lesotho)`;

const ACADEMIC_PROMPT = `Analyze this academic document and extract structured information.

RULES:
- Dates: YYYY-MM-DD format
- institutionName: Student's school (not examining body like Cambridge/ECoL)
- COSC grades: Extract NUMERIC value (e.g., "C(c SIX)" → "6")
- LGCSE/IGCSE grades: Use letter (A*, A, B, C, D, E, F, G, U)
- Extract ALL subjects with grades
- Return certificateType using the provided system naming and return the appropriate lqfLevel
- Use null for missing/illegible data

ISSUING AUTHORITY:
- issuingAuthority: Extract the examining body or issuing authority
- Common authorities: "ECoL" (Examinations Council of Lesotho), "Cambridge", "IEB", "Umalusi"
- Look for official text like "Examinations Council of Lesotho" and record as "ECoL"

CERTIFICATION EXTRACTION:
- A certified document MUST have BOTH a stamp AND a signature
- IGNORE stamps from the examining body (ECoL, Cambridge, etc.) - these are part of the certificate itself
- Only consider certification stamps from Commissioner of Oaths, Notary Public, Justice of the Peace, etc.
- isCertified: true only if a THIRD-PARTY certification stamp AND signature are present
- hasStamp: true if official certification stamp/seal visible (NOT the examining body's stamp)
- hasSignature: true if handwritten signature present near the certification stamp
- certifiedDate: Extract date from certification stamp in YYYY-MM-DD format
- certifierName: Name from certification stamp (person or organization)
- certifierTitle: Title from stamp (Commissioner of Oaths, Notary Public, JP, etc.)`;

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
			certification: null,
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

export async function analyzeAcademicDocument(
	fileBase64: string,
	mediaType: string,
	certificateTypes?: string[],
	applicantName?: string,
	certificationValidDays?: number
): Promise<AnalysisResult<CertificateDocumentResult>> {
	const types = certificateTypes ?? DEFAULT_CERTIFICATE_TYPES;
	const typeList = types.map((t) => `  - ${t}`).join('\n');

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
							text: `${ACADEMIC_PROMPT}\n\nSYSTEM CERTIFICATE TYPES:\n${typeList}`,
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

		if (
			output.documentType === 'certificate' &&
			(!output.certificateType || !types.includes(output.certificateType))
		) {
			return {
				success: false,
				error: `Invalid certificate type: ${output.certificateType}`,
			};
		}

		if (!output.certification?.isCertified) {
			const missing = [];
			if (!output.certification?.hasStamp) missing.push('stamp');
			if (!output.certification?.hasSignature) missing.push('signature');
			const detail =
				missing.length > 0 ? ` (missing: ${missing.join(' and ')})` : '';
			return { success: false, error: `Document must be certified${detail}` };
		}

		if (certificationValidDays && output.certification?.certifiedDate) {
			const certDate = new Date(output.certification.certifiedDate);
			const today = new Date();
			const daysDiff = Math.floor(
				(today.getTime() - certDate.getTime()) / (1000 * 60 * 60 * 24)
			);
			if (daysDiff > certificationValidDays) {
				return {
					success: false,
					error: `Certification has expired (certified ${daysDiff} days ago, valid for ${certificationValidDays} days)`,
				};
			}
		}

		if (applicantName && output.studentName) {
			if (!namesMatch(applicantName, output.studentName)) {
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

const RECEIPT_PROMPT = `Analyze this bank deposit slip or proof of payment document and extract structured information.

IMPORTANT:
- This should be a bank deposit slip showing payment to "Limkokwing University of Creative Technology"
- Extract the beneficiary/account holder name exactly as shown
- Extract the bank reference number or transaction ID
- Extract transaction number if visible
- Extract terminal or teller number if visible
- Dates: YYYY-MM-DD format
- Amount: Extract numeric value only (no currency symbols)
- Use null for missing/illegible data
- Set isBankDeposit to true if this appears to be a bank deposit slip`;

export async function analyzeReceipt(
	fileBase64: string,
	mediaType: string
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
				`Failed to extract structured data from receipt: ${error.cause}`
			);
		}
		throw error;
	}
}
