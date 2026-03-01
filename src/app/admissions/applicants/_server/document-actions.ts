'use server';

import { findAllCertificateTypes } from '@admissions/certificate-types';
import { findOrCreateSubjectByName } from '@admissions/subjects';
import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';
import {
	type ActionResult,
	failure,
	success,
} from '@/shared/lib/utils/actionResult';
import { normalizeNationality } from '@/shared/lib/utils/countries';
import { formatPersonName } from '@/shared/lib/utils/names';
import { applicantsService } from './service';

export type PendingDocument = {
	fileName: string;
	originalName: string;
	analysisResult: DocumentAnalysisResult;
};

export async function createApplicantFromDocuments(
	documents: PendingDocument[]
): Promise<
	ActionResult<
		Awaited<ReturnType<typeof applicantsService.createWithDocumentsAndRecords>>
	>
> {
	const identityDoc = documents.find(
		(d) => d.analysisResult.category === 'identity'
	);
	const academicDocs = documents.filter(
		(d) => d.analysisResult.category === 'academic'
	);

	if (!identityDoc) {
		return failure('Identity document is required to create an applicant');
	}

	const identity = identityDoc.analysisResult;
	if (identity.category !== 'identity') {
		return failure('Invalid identity document');
	}

	if (!identity.fullName) {
		return failure('Could not extract full name from identity document');
	}

	if (!identity.dateOfBirth) {
		return failure('Could not extract date of birth from identity document');
	}

	if (!identity.nationality) {
		return failure('Could not extract nationality from identity document');
	}

	if (!identity.gender) {
		return failure('Could not extract gender from identity document');
	}

	const applicant = await applicantsService.createWithDocumentsAndRecords(
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

	return success(applicant);
}

export async function findCertificateTypeByName(name: string) {
	const { items: certTypes } = await findAllCertificateTypes(1, '');
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
}

export async function resolveSubjectId(subjectName: string) {
	const subject = await findOrCreateSubjectByName(subjectName);
	return subject.id;
}
