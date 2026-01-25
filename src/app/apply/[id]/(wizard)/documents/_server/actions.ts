'use server';

import {
	deleteApplicantDocument,
	saveApplicantDocument,
	updateApplicantFromIdentity,
} from '@admissions/applicants/[id]/documents/_server/actions';
import { nanoid } from 'nanoid';
import type { IdentityDocumentResult } from '@/core/integrations/ai/documents';
import { uploadDocument } from '@/core/integrations/storage';
import { getFileExtension } from '@/shared/lib/utils/files';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function uploadIdentityDocument(
	applicantId: string,
	file: File,
	analysis: IdentityDocumentResult
) {
	if (file.size > MAX_FILE_SIZE) {
		throw new Error('File size exceeds 2MB limit');
	}

	const folder = 'documents/admissions';
	const ext = getFileExtension(file.name);
	const fileName = `${nanoid()}${ext}`;

	await uploadDocument(file, fileName, folder);

	await saveApplicantDocument({
		applicantId,
		fileName,
		type: 'identity',
		certification: analysis.certification,
	});

	await updateApplicantFromIdentity(applicantId, {
		fullName: analysis.fullName,
		dateOfBirth: analysis.dateOfBirth,
		nationalId: analysis.nationalId,
		nationality: analysis.nationality,
		gender: analysis.gender,
		birthPlace: analysis.birthPlace,
		address: analysis.address,
	});

	return { fileName, analysis };
}

export async function removeIdentityDocument(id: string, fileUrl: string) {
	return deleteApplicantDocument(id, fileUrl);
}
