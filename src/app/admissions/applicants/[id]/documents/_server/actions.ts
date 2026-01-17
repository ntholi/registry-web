'use server';

import type { DocumentType, DocumentVerificationStatus } from '@/core/database';
import {
	deleteDocument,
	uploadDocument as uploadToStorage,
} from '@/core/integrations/storage';
import { applicantDocumentsService } from './service';

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

export async function uploadApplicantDocument(
	applicantId: string,
	file: File,
	type: DocumentType
) {
	const folder = `documents/admissions/applicants/${applicantId}`;
	const fileName = await uploadToStorage(
		file,
		`${Date.now()}-${file.name}`,
		folder
	);

	const fileUrl = `${process.env.R2_PUBLIC_URL}/${folder}/${fileName}`;

	return applicantDocumentsService.uploadDocument(
		{
			fileName: file.name,
			fileUrl,
			type,
		},
		applicantId,
		file.size
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
	const publicUrl = process.env.R2_PUBLIC_URL || '';
	const key = fileUrl.replace(`${publicUrl}/`, '');

	await deleteDocument(key);
	return applicantDocumentsService.delete(id);
}
