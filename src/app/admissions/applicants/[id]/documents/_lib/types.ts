import type {
	applicantDocuments,
	DocumentType,
	DocumentVerificationStatus,
	documents,
	ResultClassification,
} from '@/core/database';

export type ApplicantDocument = typeof applicantDocuments.$inferSelect & {
	document: typeof documents.$inferSelect;
};
export type ApplicantDocumentInsert = typeof applicantDocuments.$inferInsert;

export type UploadDocumentInput = {
	fileName: string;
	fileUrl: string;
	type: DocumentType;
};

export type VerifyDocumentInput = {
	status: DocumentVerificationStatus;
	rejectionReason?: string;
};

export type ExtractedIdentityData = {
	fullName?: string | null;
	dateOfBirth?: string | null;
	nationalId?: string | null;
	nationality?: string | null;
	gender?: string | null;
	birthPlace?: string | null;
	address?: string | null;
};

export type ExtractedAcademicData = {
	institutionName?: string | null;
	qualificationName?: string | null;
	examYear?: number | null;
	certificateType?: string | null;
	certificateNumber?: string | null;
	candidateNumber?: string | null;
	subjects?:
		| {
				name: string;
				grade: string;
		  }[]
		| null;
	overallClassification?: ResultClassification | null;
};
