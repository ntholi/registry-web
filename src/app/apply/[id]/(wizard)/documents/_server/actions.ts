'use server';

import {
	deleteApplicantDocument,
	saveApplicantDocument,
	updateApplicantFromIdentity,
} from '@admissions/applicants/[id]/documents/_server/actions';
import { type ActionResult, extractError } from '@apply/_lib/errors';
import { nanoid } from 'nanoid';
import type { IdentityDocumentResult } from '@/core/integrations/ai/documents';
import { uploadDocument } from '@/core/integrations/storage';
import { getFileExtension } from '@/shared/lib/utils/files';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

type UploadResult = { fileName: string; analysis: IdentityDocumentResult };

export async function uploadIdentityDocument(
	applicantId: string,
	file: File,
	analysis: IdentityDocumentResult
): Promise<ActionResult<UploadResult>> {
	try {
		if (file.size > MAX_FILE_SIZE) {
			return { success: false, error: 'File size exceeds 2MB limit' };
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

		return { success: true, data: { fileName, analysis } };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}

export async function removeIdentityDocument(
	id: string,
	fileUrl: string
): Promise<ActionResult<void>> {
	try {
		await deleteApplicantDocument(id, fileUrl);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}
