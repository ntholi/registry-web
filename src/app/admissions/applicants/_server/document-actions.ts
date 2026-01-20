'use server';

import { findAllCertificateTypes } from '@admissions/certificate-types';
import { findOrCreateSubjectByName } from '@admissions/subjects';
import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';
import { applicantsService } from './service';

export type PendingDocument = {
	fileName: string;
	originalName: string;
	analysisResult: DocumentAnalysisResult;
};

export async function createApplicantFromDocuments(
	documents: PendingDocument[]
) {
	const identityDoc = documents.find(
		(d) => d.analysisResult.category === 'identity'
	);
	const academicDocs = documents.filter(
		(d) => d.analysisResult.category === 'academic'
	);

	if (!identityDoc) {
		throw new Error('Identity document is required to create an applicant');
	}

	const identity = identityDoc.analysisResult;
	if (identity.category !== 'identity') {
		throw new Error('Invalid identity document');
	}

	if (!identity.fullName) {
		throw new Error('Could not extract full name from identity document');
	}

	if (!identity.dateOfBirth) {
		throw new Error('Could not extract date of birth from identity document');
	}

	if (!identity.nationality) {
		throw new Error('Could not extract nationality from identity document');
	}

	if (!identity.gender) {
		throw new Error('Could not extract gender from identity document');
	}

	const applicant = await applicantsService.createWithDocumentsAndRecords(
		{
			fullName: identity.fullName,
			dateOfBirth: identity.dateOfBirth,
			nationalId: identity.nationalId ?? undefined,
			nationality: identity.nationality,
			gender: identity.gender,
			birthPlace: identity.birthPlace ?? undefined,
			address: identity.address ?? undefined,
		},
		documents,
		academicDocs
	);

	return applicant;
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
