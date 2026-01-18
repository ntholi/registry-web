'use server';

import type { DocumentType, DocumentVerificationStatus } from '@/core/database';
import { deleteDocument } from '@/core/integrations/storage';
import { applicantDocumentsService } from './service';

const BASE_URL = 'https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev';

export async function getDocumentFolder(applicantId: string) {
	return `documents/admissions/applicants/${applicantId}`;
}

export async function getApplicantDocument(id: string) {
	return applicantDocumentsService.get(id);
}

export async function findDocumentsByApplicant(applicantId: string, page = 1) {
	return applicantDocumentsService.findByApplicant(applicantId, page);
}

export async function findDocumentsByType(
	applicantId: string,
	type: DocumentType
) {
	return applicantDocumentsService.findByType(applicantId, type);
}

export async function saveApplicantDocument(data: {
	applicantId: string;
	fileName: string;
	type: DocumentType;
}) {
	const folder = await getDocumentFolder(data.applicantId);
	const fileUrl = `${BASE_URL}/${folder}/${data.fileName}`;

	return applicantDocumentsService.uploadDocument(
		{
			fileName: data.fileName,
			fileUrl,
			type: data.type,
		},
		data.applicantId,
		0
	);
}

export async function verifyApplicantDocument(
	id: string,
	status: DocumentVerificationStatus,
	rejectionReason?: string
) {
	return applicantDocumentsService.verifyDocument(id, status, rejectionReason);
}

export async function deleteApplicantDocument(id: string, fileUrl: string) {
	const key = fileUrl.replace(`${BASE_URL}/`, '');
	await deleteDocument(key);
	return applicantDocumentsService.delete(id);
}
