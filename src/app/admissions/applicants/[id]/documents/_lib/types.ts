import type {
	applicantDocuments,
	DocumentCategory,
	DocumentVerificationStatus,
} from '@/core/database';

export type ApplicantDocument = typeof applicantDocuments.$inferSelect;
export type ApplicantDocumentInsert = typeof applicantDocuments.$inferInsert;

export type UploadDocumentInput = {
	fileName: string;
	fileUrl: string;
	category: DocumentCategory;
};

export type VerifyDocumentInput = {
	status: DocumentVerificationStatus;
	rejectionReason?: string;
};
