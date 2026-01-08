'use server';

import type {
	DocumentCategory,
	DocumentVerificationStatus,
} from '@/core/database';
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

export async function findDocumentsByCategory(
	applicantId: string,
	category: DocumentCategory
) {
	return applicantDocumentsService.findByCategory(applicantId, category);
}

export async function uploadApplicantDocument(
	applicantId: string,
	file: File,
	category: DocumentCategory
) {
	const fileName = await uploadToStorage(
		file,
		`${applicantId}-${Date.now()}-${file.name}`,
		'applicant-documents'
	);

	const fileUrl = `${process.env.R2_PUBLIC_URL}/applicant-documents/${fileName}`;

	return applicantDocumentsService.uploadDocument(
		{
			applicantId,
			fileName: file.name,
			fileUrl,
			category,
		},
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
	const urlParts = fileUrl.split('/');
	const key = `applicant-documents/${urlParts[urlParts.length - 1]}`;

	await deleteDocument(key);
	return applicantDocumentsService.delete(id);
}
