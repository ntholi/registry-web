'use server';

import { deleteAcademicRecord } from '@admissions/applicants/[id]/academic-records/_server/actions';
import {
	createAcademicRecordFromDocument,
	saveApplicantDocument,
} from '@admissions/applicants/[id]/documents/_server/actions';
import { nanoid } from 'nanoid';
import type { CertificateDocumentResult } from '@/core/integrations/ai/documents';
import { uploadDocument } from '@/core/integrations/storage';
import { getFileExtension } from '@/shared/lib/utils/files';

export async function uploadCertificateDocument(
	applicantId: string,
	file: File,
	analysis: CertificateDocumentResult
) {
	const folder = 'documents/admissions';
	const ext = getFileExtension(file.name);
	const fileName = `${nanoid()}${ext}`;

	await uploadDocument(file, fileName, folder);

	const type = analysis.documentType;

	await saveApplicantDocument({
		applicantId,
		fileName,
		type,
	});

	if (
		(type === 'certificate' ||
			type === 'transcript' ||
			type === 'academic_record') &&
		analysis.examYear &&
		analysis.institutionName
	) {
		await createAcademicRecordFromDocument(applicantId, {
			institutionName: analysis.institutionName,
			qualificationName: analysis.qualificationName,
			examYear: analysis.examYear,
			certificateType: analysis.certificateType,
			certificateNumber: analysis.certificateNumber,
			subjects: analysis.subjects,
			overallClassification: analysis.overallClassification,
		});
	}

	return { fileName, type, analysis };
}

export async function removeAcademicRecord(id: string) {
	return deleteAcademicRecord(id);
}
