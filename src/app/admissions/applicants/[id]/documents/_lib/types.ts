import type {
	applicantDocuments,
	DocumentType,
	DocumentVerificationStatus,
	documents,
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
