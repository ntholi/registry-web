import { getCertificateTypeByName } from '@admissions/certificate-types/_server/actions';
import { google } from '@ai-sdk/google';
import { generateText, NoObjectGeneratedError, Output } from 'ai';
import type { z } from 'zod';
import {
	academicSchema,
	type certificationSchema,
	documentAnalysisSchema,
	gradeConfidenceMin,
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

const identityConfidenceMin = 90;

const CERTIFICATION_RULES = `CERTIFICATION:
- isCertified: true if document shows any official certification (stamp, seal, or official mark)`;

const ACADEMIC_RULES = `- institutionName: Student's school (not examining body like Cambridge/ECoL)
- LGCSE grades: Use letter (A*, A, B, C, D, E, F, G, U)
- IGCSE vs Edexcel IGCSE DISAMBIGUATION (CRITICAL):
  * Cambridge IGCSE ("International General Certificate of Secondary Education", issued by Cambridge Assessment International Education / CAIE / CIE / UCLES): Uses LETTER grades (A*, A, B, C, D, E, F, G, U). Set certificateType to "IGCSE". NEVER set to "Edexcel IGCSE".
  * Pearson Edexcel International GCSE (issued by Pearson/Edexcel): Uses NUMERIC grades (9, 8, 7, 6, 5, 4, 3, 2, 1, U). Set certificateType to "Edexcel IGCSE". NEVER set to "IGCSE".
  * If the document says "Cambridge" or "CAIE" or "University of Cambridge" → it is IGCSE (letter grades), NOT Edexcel.
  * If the document says "Pearson" or "Edexcel" → it is Edexcel IGCSE (numeric grades), NOT Cambridge.
- Extract ALL subjects with grades
- Only accept LGCSE (or equivalent) or higher certificates/result slips. If lower than LGCSE, classify as "other" and set certificateType to null.
- candidateNumber: Extract if present, commonly labeled "Center/Candidate Number", "Centre/Candidate Number", or "Center / Cand. No.".
- NSC VERIFICATION LETTERS: Documents from ECoL verifying NSC results often provide COSC/LGCSE equivalent grades at the bottom. When present, extract those COSC/LGCSE letter grades (A-G, U) as the subjects. Set certificateType to "NSC". These are valid academic documents.`;

const GRADE_FORMAT_RULES = `GRADE FORMAT VERIFICATION (CRITICAL):
- LGCSE/Cambridge IGCSE grades are often displayed as a letter followed by the same letter in parentheses, e.g., C(c), B(b), E(e), F(f), G(g).
- The uppercase letter BEFORE the parentheses and the lowercase letter INSIDE the parentheses represent the SAME grade. Use BOTH symbols to cross-verify.
- If the letter before the brackets does NOT match the letter inside, flag as unreadable (add to "unreadableGrades").
- Example: "C(c)" → grade is C (verified). "B(d)" → mismatch, flag as unreadable.
- Always extract only the single letter grade (e.g., "C"), not the full bracket notation.
- Edexcel IGCSE grades are displayed as a number followed by the word in parentheses, e.g., "6 (six)", "5 (five)". Extract only the numeric grade (e.g., "6").`;

const ANALYSIS_PROMPT = `Analyze this document and extract information.

CATEGORIES:
- identity: IDs, passports, birth certificates  
- academic: Certificates and academic records (results slips, transcripts, statements of results)
- other: Receipts, statements, medical reports

DOCUMENT TYPE CLASSIFICATION (CRITICAL FOR ACADEMIC):
- certificate: Official credential document issued upon COMPLETION of a qualification. Key indicators:
  * Formal title: "Certificate", "Diploma", "Degree"
  * Completion language: "This is to certify that...", "has successfully completed", "conferred upon", "awarded to"
  * Has institution seal, signatures, formal certification
  * Examples: LGCSE Certificate, Diploma Certificate, Degree Certificate
- academic_record: Any document showing grades/results (NOT the final credential). Key indicators:
  * Results/grades language: "Statement of Results", "Results Slip", "Transcript", "Academic Record"
  * Shows subject list with grades/marks
  * May show GPA, cumulative average, or individual subject scores
  * Verification or equivalence letters from examining bodies (e.g., ECoL) that confirm results and/or provide grade equivalences
  * "To Whom It May Concern" letters from examining councils that list subjects with grades
  * Examples: LGCSE results slip, IGCSE statement of results, NSC results, university transcripts, ECoL verification letters, NSC equivalence letters

RULES:
${COMMON_RULES}
${ACADEMIC_RULES}
- isEcol: true if document mentions ECoL/Examinations Council of Lesotho, else false.
- isCambridge: true if document mentions Cambridge/CAIE/CIE/UCLES, else false.
- isPearson: true if document mentions Pearson/Edexcel, else false.

IDENTITY EXTRACTION QUALITY (CRITICAL):
- Confidence score (0-100): 100 = crystal clear, 90-99 = readable, <90 = too unclear.
- If NOT 90%+ sure about ANY required field, set confidence < 90.

GRADE ACCURACY (CRITICAL):
- Per-subject confidence (0-100). If <100, add to "unreadableGrades".
- DO NOT guess grades. Accuracy > completeness.

${GRADE_FORMAT_RULES}

${CERTIFICATION_RULES}`;

const IDENTITY_PROMPT = `Analyze this identity document and extract structured information.

RULES:
${COMMON_RULES}

EXTRACTION QUALITY (CRITICAL):
- Provide a confidence score (0-100) for the overall extraction.
- 100 = absolutely certain, text is crystal clear, no doubt about any field.
- 90-99 = confident enough to proceed, minor quality issues but still clearly readable.
- <90 = the text is not clear enough (blurry, faded, partially obscured, ambiguous).
- If you are NOT at least 90% sure about ANY required field, you MUST set confidence < 90.

${CERTIFICATION_RULES}`;

const ACADEMIC_PROMPT = `Analyze this academic document and extract structured information.

DOCUMENT TYPE CLASSIFICATION (CRITICAL):
- certificate: Official credential document issued upon COMPLETION of a qualification. Key indicators:
  * Formal title: "Certificate", "Diploma Certificate", "Degree"
  * Completion language: "This is to certify that...", "has successfully completed", "conferred upon", "awarded to"
  * Has institution seal, signatures, formal certification
  * Examples: LGCSE Certificate, Diploma Certificate, Degree Certificate, National Certificate
- academic_record: Any document showing grades/results (NOT the final credential). Key indicators:
  * Results/grades language: "Statement of Results", "Results Slip", "Transcript", "Academic Record", "Grade Report"
  * Shows subject/course list with grades/marks
  * May show GPA, cumulative average, or individual subject scores
  * Can be preliminary or final results
  * Verification or equivalence letters from examining bodies (e.g., ECoL) that confirm results and/or provide grade equivalences
  * "To Whom It May Concern" letters from examining councils that list subjects with grades
  * Examples: LGCSE results slip, IGCSE statement of results, NSC results, university transcripts, diploma transcripts, ECoL verification letters, NSC equivalence letters


RULES:
${COMMON_RULES}
${ACADEMIC_RULES}

GRADE ACCURACY (CRITICAL - ZERO TOLERANCE):
- Per-subject confidence (0-100): 100 = certain, 99 = distinguishable, <99 = uncertain.
- If confidence < 100 for ANY subject, add to "unreadableGrades".
- DO NOT guess. If "B" could be "D" or "8", that is <90. Better unreadable than wrong.

${GRADE_FORMAT_RULES}

ISSUING AUTHORITY:
- issuingAuthority: Extract examining body (ECoL, Cambridge, Pearson/Edexcel, IEB, Umalusi)
- "Examinations Council of Lesotho" → record as "ECoL"
- isEcol: true if the document somehow indicates ECoL/Examinations Council of Lesotho in the document, otherwise false. Always set true or false; do not leave null.
- isCambridge: true if the document is issued by Cambridge Assessment International Education (Cambridge, CAIE, CIE, UCLES), otherwise false. Always set true or false; do not leave null.
  * When isCambridge is true and document is IGCSE-level, certificateType MUST be "IGCSE" (NOT "Edexcel IGCSE")
- isPearson: true if the document is issued by Pearson/Edexcel, otherwise false. Always set true or false; do not leave null.
  * When isPearson is true and document is IGCSE-level, certificateType MUST be "Edexcel IGCSE" (NOT "IGCSE")

${CERTIFICATION_RULES}`;

const DEFAULT_CERTIFICATE_TYPES = [
	'LGCSE',
	'COSC',
	'IGCSE',
	'Edexcel IGCSE',
	'NSC',
	'GCE O-Level',
	'GCE AS Level',
	'GCE A-Level',
	'Certificate',
	'Diploma',
	'Degree',
];

const ACCEPTED_CERTIFICATE_TYPES = DEFAULT_CERTIFICATE_TYPES;

function isAcceptedCertificateType(name: string): boolean {
	const normalized = name.trim().toLowerCase();
	return ACCEPTED_CERTIFICATE_TYPES.some(
		(type) => type.trim().toLowerCase() === normalized
	);
}

export async function analyzeDocument(
	fileBase64: string,
	mediaType: string
): Promise<AnalysisResult<DocumentAnalysisResult>> {
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
			return {
				success: false,
				error: 'Failed to analyze document: no output generated',
			};
		}

		const { category, identity, academic, other } = output;

		if (category === 'identity' && identity) {
			if (identity.confidence < identityConfidenceMin) {
				return {
					success: false,
					error:
						'The document text is not clear enough. Please upload a clearer image.',
				};
			}
			return { success: true, data: { category: 'identity', ...identity } };
		}

		if (category === 'academic' && academic) {
			if (academic.unreadableGrades && academic.unreadableGrades.length > 0) {
				return {
					success: false,
					error: `Unable to read grades for: ${academic.unreadableGrades.join(
						', '
					)}. Please upload a clearer image.`,
				};
			}
			const lowConfidenceSubjects =
				academic.subjects
					?.filter((s) => s.confidence < gradeConfidenceMin)
					.map((s) => s.name) ?? [];
			if (lowConfidenceSubjects.length > 0) {
				return {
					success: false,
					error: `Uncertain grade readings for: ${lowConfidenceSubjects.join(
						', '
					)}. Please upload a clearer image.`,
				};
			}
			if (
				academic.documentType === 'certificate' &&
				(!academic.certificateType ||
					!isAcceptedCertificateType(academic.certificateType))
			) {
				return {
					success: false,
					error: `Only LGCSE or equivalent or higher certificates/result slips are accepted. Invalid certificate type: ${academic.certificateType}.`,
				};
			}
			return { success: true, data: { category: 'academic', ...academic } };
		}

		if (other) {
			return { success: true, data: { category: 'other', ...other } };
		}

		return {
			success: true,
			data: {
				category: 'other',
				documentType: 'other',
				description: 'Unable to classify document',
				certification: null,
			},
		};
	} catch (error) {
		if (NoObjectGeneratedError.isInstance(error)) {
			console.error('Document analysis failed:', {
				cause: error.cause,
				text: error.text,
			});
			return {
				success: false,
				error: `Failed to extract structured data from document: ${error.cause}`,
			};
		}
		return {
			success: false,
			error:
				error instanceof Error ? error.message : 'An unexpected error occurred',
		};
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

		if (output.confidence < identityConfidenceMin) {
			return {
				success: false,
				error:
					'The document text is not clear enough. Please upload a clearer image.',
			};
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
	types: CertificateTypeInput[] | undefined
): Array<{ name: string; lqfLevel: number | null }> {
	if (!types)
		return DEFAULT_CERTIFICATE_TYPES.map((t) => ({ name: t, lqfLevel: null }));
	return types.map((t) =>
		typeof t === 'string' ? { name: t, lqfLevel: null } : t
	);
}

export async function analyzeAcademicDocument(
	fileBase64: string,
	mediaType: string,
	certificateTypes?: CertificateTypeInput[],
	applicantName?: string
): Promise<AnalysisResult<CertificateDocumentResult>> {
	const normalizedTypes = normalizeCertificateTypes(certificateTypes);
	const acceptedTypes = normalizedTypes.filter((type) =>
		isAcceptedCertificateType(type.name)
	);
	const types =
		acceptedTypes.length > 0
			? acceptedTypes
			: normalizeCertificateTypes(undefined);
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
			tools: { code_execution: google.tools.codeExecution({}) },
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
					', '
				)}. Please upload a clearer image.`,
			};
		}

		const lowConfidenceSubjects =
			output.subjects
				?.filter((s) => s.confidence < gradeConfidenceMin)
				.map((s) => s.name) ?? [];
		if (lowConfidenceSubjects.length > 0) {
			return {
				success: false,
				error: `Uncertain grade readings for: ${lowConfidenceSubjects.join(
					', '
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
				error: `Only LGCSE or equivalent or higher certificates/result slips are accepted. Invalid certificate type: ${output.certificateType}.`,
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
			if (!isAcceptedCertificateType(output.certificateType)) {
				return {
					success: false,
					error: `Only LGCSE or equivalent or higher certificates/result slips are accepted. Invalid certificate type: ${output.certificateType}.`,
				};
			}
			const dbCertType = await getCertificateTypeByName(output.certificateType);

			if (!dbCertType) {
				return {
					success: false,
					error: `Certificate type "${output.certificateType}" is not recognized. Only certificates registered in the system are accepted.`,
				};
			}

			if (dbCertType.lqfLevel !== null && dbCertType.lqfLevel < 4) {
				return {
					success: false,
					error:
						'Only LGCSE or equivalent or higher certificates/result slips are accepted.',
				};
			}

			const isIGCSE =
				output.certificateType?.toLowerCase().includes('igcse') &&
				(output.isCambridge || output.isPearson);
			if (dbCertType.lqfLevel === 4 && !output.isEcol && !isIGCSE) {
				return {
					success: false,
					error:
						'LQF Level 4 certificates and result slips must be issued by the Examinations Council of Lesotho (ECoL), Cambridge (for IGCSE), or Pearson/Edexcel (for Edexcel IGCSE).',
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

			const friendlyMessage = getAcademicDocumentErrorMessage(error);
			return { success: false, error: friendlyMessage };
		}
		return {
			success: false,
			error:
				error instanceof Error ? error.message : 'An unexpected error occurred',
		};
	}
}

function getAcademicDocumentErrorMessage(
	error: NoObjectGeneratedError
): string {
	const cause = error.cause;
	if (cause && typeof cause === 'object' && 'issues' in cause) {
		const zodError = cause as {
			issues: Array<{ path: string[]; message: string }>;
		};
		const subjectsIssue = zodError.issues.find((i) =>
			i.path.includes('subjects')
		);
		if (subjectsIssue) {
			return 'Could not extract subjects from this document. Please ensure you upload a clear image of an academic results slip, transcript, or certificate that shows individual subjects and grades.';
		}
		const unreadableIssue = zodError.issues.find((i) =>
			i.path.includes('unreadableGrades')
		);
		if (unreadableIssue) {
			return 'Some grades on this document are unclear. Please upload a higher quality image where all grades are clearly visible.';
		}
	}
	return 'Could not analyze this academic document. Please ensure the image is clear and shows a valid academic certificate, results slip, or transcript.';
}

const RECEIPT_PROMPT = `Analyze this payment document. It can be either a BANK DEPOSIT SLIP or a UNIVERSITY-ISSUED SALES RECEIPT.

DOCUMENT TYPE IDENTIFICATION:

TYPE 1 - BANK DEPOSIT SLIP (receiptType: "bank_deposit"):
A document issued by a bank confirming a cash or cheque deposit. Key indicators:
- Bank name/logo present (e.g., Standard Lesotho Bank, FNB, Nedbank)
- Transaction/reference number
- Account name and/or account number
- Deposit amount
- Date of transaction
- May show "Deposit", "Transaction", "Receipt" terminology
Set isBankDeposit to TRUE.
- reference: The bank reference number or transaction ID
- beneficiaryName: The account holder/beneficiary (who received the deposit)
- depositorName: The person who made the deposit
- bankName: The bank name

TYPE 2 - UNIVERSITY SALES RECEIPT (receiptType: "sales_receipt"):
A receipt issued by a university (e.g., Limkokwing University) confirming a payment was received. Key indicators:
- "SALES RECEIPT" title
- Sales Receipt number (e.g., SR-19046)
- "Bill To" field
- Item description (e.g., "Application fees")
- Payment Details section with Payment Mode (e.g., "Bank Remittance", "Cash")
- University branding/logo/stamp
- May have "Finance Department" stamp
Set isBankDeposit to FALSE.
- receiptNumber: The sales receipt number (e.g., SR-19046)
- reference: Same as receiptNumber (SR-19046)
- beneficiaryName: The organization that issued the receipt (e.g., "Limkokwing University of Creative Technology")
- depositorName: The "Reference" or name of the person who paid
- paymentMode: The payment method (e.g., "Bank Remittance", "Cash")
- bankName: null (not a bank document)

If the document is neither, set receiptType to "unknown" and isBankDeposit to FALSE.

RULES:
${COMMON_RULES}
- amountDeposited: Numeric value only (no currency symbols). Use the total amount.
- dateDeposited: Date of the transaction/receipt in YYYY-MM-DD format
- currency: Extract currency code (LSL, ZAR, USD, etc.)`;

export async function analyzeReceipt(
	fileBase64: string,
	mediaType: string
): Promise<AnalysisResult<ReceiptResult>> {
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
			return {
				success: false,
				error: 'Failed to analyze receipt: no output generated',
			};
		}

		return { success: true, data: output };
	} catch (error) {
		if (NoObjectGeneratedError.isInstance(error)) {
			console.error('Receipt analysis failed:', {
				cause: error.cause,
				text: error.text,
			});
			return {
				success: false,
				error: `Failed to extract structured data from receipt: ${error.cause}`,
			};
		}
		return {
			success: false,
			error:
				error instanceof Error ? error.message : 'An unexpected error occurred',
		};
	}
}
