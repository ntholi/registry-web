'use server';

import { findAllCertificateTypes } from '@admissions/certificate-types';
import { findOrCreateSubjectByName } from '@admissions/subjects';
import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';
import { normalizeNationality } from '@/shared/lib/utils/countries';
import { UserFacingError } from '@/shared/lib/utils/extractError';
import { formatPersonName } from '@/shared/lib/utils/names';
import { applicantsService } from './service';

export type PendingDocument = {
	fileName: string;
	fileUrl: string;
	originalName: string;
	analysisResult: DocumentAnalysisResult;
};

export const createApplicantFromDocuments = createAction(
	async (documents: PendingDocument[]) => {
		const identityDoc = documents.find(
			(d) => d.analysisResult.category === 'identity'
		);
		const academicDocs = documents.filter(
			(d) => d.analysisResult.category === 'academic'
		);

		if (!identityDoc) {
			throw new UserFacingError(
				'Identity document is required to create an applicant'
			);
		}

		const identity = identityDoc.analysisResult;
		if (identity.category !== 'identity') {
			throw new UserFacingError('Invalid identity document');
		}

		if (!identity.fullName) {
			throw new UserFacingError(
				'Could not extract full name from identity document'
			);
		}

		if (!identity.dateOfBirth) {
			throw new UserFacingError(
				'Could not extract date of birth from identity document'
			);
		}

		if (!identity.nationality) {
			throw new UserFacingError(
				'Could not extract nationality from identity document'
			);
		}

		if (!identity.gender) {
			throw new UserFacingError(
				'Could not extract gender from identity document'
			);
		}

		return applicantsService.createWithDocumentsAndRecords(
			{
				fullName: formatPersonName(identity.fullName) ?? identity.fullName,
				dateOfBirth: identity.dateOfBirth,
				nationalId: identity.nationalId ?? undefined,
				nationality:
					normalizeNationality(identity.nationality) ?? identity.nationality,
				gender: identity.gender,
				birthPlace: identity.birthPlace ?? undefined,
				address: identity.address ?? undefined,
			},
			documents,
			academicDocs
		);
	}
);

export const findCertificateTypeByName = createAction(async (name: string) => {
	const { items: certTypes } = unwrap(await findAllCertificateTypes(1, ''));
	const normalized = name.toLowerCase().trim();

	const matched = certTypes.find((ct) => {
		const ctName = ct.name.toLowerCase().trim();
		return (
			ctName === normalized ||
			ctName.includes(normalized) ||
			normalized.includes(ctName)
		);
	});

	return matched ?? certTypes[0] ?? null;
});

export const resolveSubjectId = createAction(async (subjectName: string) => {
	const subject = unwrap(await findOrCreateSubjectByName(subjectName));
	return subject.id;
});
