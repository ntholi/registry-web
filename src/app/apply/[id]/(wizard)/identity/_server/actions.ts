'use server';

import { getApplicant } from '@admissions/applicants';
import {
	deleteApplicantDocument,
	findDocumentsByType,
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

async function hasValidIdentityDocument(
	applicantId: string
): Promise<ActionResult<boolean>> {
	const applicant = await getApplicant(applicantId);
	if (!applicant) {
		return { success: false, error: 'Applicant not found' };
	}
	const docs = await findDocumentsByType(applicantId, 'identity');
	const hasIdentityDoc = docs.some((doc) => doc.document.fileUrl);
	const hasIdentityData = Boolean(
		applicant.nationalId || applicant.dateOfBirth
	);
	return { success: true, data: hasIdentityDoc && hasIdentityData };
}

export async function uploadIdentityDocument(
	applicantId: string,
	file: File,
	analysis: IdentityDocumentResult
): Promise<ActionResult<UploadResult>> {
	try {
		const locked = await hasValidIdentityDocument(applicantId);
		if (!locked.success) {
			return { success: false, error: locked.error };
		}
		if (locked.data) {
			return {
				success: false,
				error: 'A valid identity document is already attached',
			};
		}

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
		});

		const updateResult = await updateApplicantFromIdentity(applicantId, {
			fullName: analysis.fullName,
			dateOfBirth: analysis.dateOfBirth,
			nationalId: analysis.nationalId,
			nationality: analysis.nationality,
			gender: analysis.gender,
			birthPlace: analysis.birthPlace,
			address: analysis.address,
		});
		if (!updateResult.success) {
			return { success: false, error: updateResult.error };
		}

		return { success: true, data: { fileName, analysis } };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}

export async function removeIdentityDocument(
	applicantId: string,
	id: string,
	fileUrl: string
): Promise<ActionResult<void>> {
	try {
		const locked = await hasValidIdentityDocument(applicantId);
		if (!locked.success) {
			return { success: false, error: locked.error };
		}
		if (locked.data) {
			return {
				success: false,
				error: 'Valid identity documents cannot be removed',
			};
		}

		await deleteApplicantDocument(id, fileUrl);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}
