'use server';

import {
	findApplicantByNationalIdWithUser,
	getApplicant,
} from '@admissions/applicants';
import {
	deleteApplicantDocument,
	findDocumentsByType,
	saveApplicantDocument,
	updateApplicantFromIdentity,
} from '@admissions/applicants/[id]/documents/_server/actions';
import type { IdentityDocumentResult } from '@/core/integrations/ai/documents';
import { uploadFile } from '@/core/integrations/storage';
import {
	generateUploadKey,
	StoragePaths,
} from '@/core/integrations/storage-utils';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';
import { UserFacingError } from '@/shared/lib/utils/extractError';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

type UploadResult = { fileName: string; analysis: IdentityDocumentResult };

async function hasValidIdentityDocument(applicantId: string): Promise<boolean> {
	const applicant = unwrap(await getApplicant(applicantId));
	if (!applicant) {
		throw new UserFacingError('Applicant not found');
	}
	const docs = unwrap(await findDocumentsByType(applicantId, 'identity'));
	const hasIdentityDoc = docs.some((doc) => doc.document.fileUrl);
	const hasIdentityData = Boolean(
		applicant.nationalId || applicant.dateOfBirth
	);
	return hasIdentityDoc && hasIdentityData;
}

export const uploadIdentityDocument = createAction(
	async (
		applicantId: string,
		file: File,
		analysis: IdentityDocumentResult
	): Promise<UploadResult> => {
		const locked = await hasValidIdentityDocument(applicantId);
		if (locked) {
			throw new UserFacingError(
				'A valid identity document is already attached'
			);
		}

		const nationalId = analysis.nationalId?.trim();
		if (nationalId) {
			const existing = unwrap(
				await findApplicantByNationalIdWithUser(nationalId)
			);
			if (existing && existing.id !== applicantId) {
				const email = existing.user?.email;
				throw new UserFacingError(
					email
						? `ID document is already registered with ${email}`
						: 'ID document is already registered with another account'
				);
			}
		}

		if (file.size > MAX_FILE_SIZE) {
			throw new UserFacingError('File size exceeds 2MB limit');
		}

		const fileKey = generateUploadKey(
			(fileName) => StoragePaths.applicantDocument(applicantId, fileName),
			file.name
		);

		await uploadFile(file, fileKey);

		await saveApplicantDocument({
			applicantId,
			fileName: file.name,
			fileUrl: fileKey,
			type: 'identity',
		}).then(unwrap);

		await updateApplicantFromIdentity(applicantId, {
			fullName: analysis.fullName,
			dateOfBirth: analysis.dateOfBirth,
			nationalId: analysis.nationalId,
			nationality: analysis.nationality,
			gender: analysis.gender,
			birthPlace: analysis.birthPlace,
			address: analysis.address,
		}).then(unwrap);

		return { fileName: file.name, analysis };
	}
);

export const removeIdentityDocument = createAction(
	async (applicantId: string, id: string, fileUrl: string) => {
		const locked = await hasValidIdentityDocument(applicantId);
		if (locked) {
			throw new UserFacingError('Valid identity documents cannot be removed');
		}

		await deleteApplicantDocument(id, fileUrl).then(unwrap);
	}
);
