import type {
	CertificateDocumentResult,
	DocumentAnalysisResult,
	IdentityDocumentResult,
	ReceiptResult,
} from '@/core/integrations/ai/documents';

export type DocumentUploadType = 'identity' | 'certificate' | 'receipt' | 'any';

export type UploadState = 'idle' | 'uploading' | 'reading' | 'ready' | 'error';

type AnalysisResultMap = {
	identity: IdentityDocumentResult;
	certificate: CertificateDocumentResult;
	receipt: ReceiptResult;
	any: DocumentAnalysisResult;
};

export type DocumentUploadResult<T extends DocumentUploadType> = {
	file: File;
	base64: string;
	analysis: AnalysisResultMap[T];
};
