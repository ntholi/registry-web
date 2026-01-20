'use server';

import {
	saveApplicantDocument,
	updateApplicantFromIdentity,
} from '@admissions/applicants/[id]/documents/_server/actions';
import { nanoid } from 'nanoid';
import type { IdentityDocumentResult } from '@/core/integrations/ai/documents';
import { uploadDocument } from '@/core/integrations/storage';
import { getFileExtension } from '@/shared/lib/utils/files';

export async function uploadIdentityDocument(
	applicantId: string,
	file: File,
	analysis: IdentityDocumentResult
) {
	const folder = 'documents/admissions';
	const ext = getFileExtension(file.name);
	const fileName = `${nanoid()}${ext}`;

	await uploadDocument(file, fileName, folder);

	await saveApplicantDocument({
		applicantId,
		fileName,
		type: 'identity',
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
