'use server';

import type { CertificateDocumentResult } from '@/core/integrations/ai/documents';
import { uploadDocument } from '@/core/integrations/storage';
import { getFileExtension } from '@/shared/lib/utils/files';
import { deleteAcademicRecord } from '@admissions/applicants/[id]/academic-records/_server/actions';
import {
	createAcademicRecordFromDocument,
	saveApplicantDocument,
} from '@admissions/applicants/[id]/documents/_server/actions';
import { type ActionResult, extractError } from '@apply/_lib/errors';
import { nanoid } from 'nanoid';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const CURRENT_YEAR = new Date().getFullYear();

type UploadResult = {
	fileName: string;
	type: string;
	analysis: CertificateDocumentResult;
};

export async function uploadCertificateDocument(
	applicantId: string,
	file: File,
	analysis: CertificateDocumentResult,
): Promise<ActionResult<UploadResult>> {
	try {
		if (file.size > MAX_FILE_SIZE) {
			return { success: false, error: 'File size exceeds 2MB limit' };
		}

		const folder = 'documents/admissions';
		const ext = getFileExtension(file.name);
		const fileName = `${nanoid()}${ext}`;

		await uploadDocument(file, fileName, folder);

		const type = analysis.documentType;

		const savedDoc = await saveApplicantDocument({
			applicantId,
			fileName,
			type,
		});

		const isAcademicType =
			type === 'certificate' ||
			type === 'transcript' ||
			type === 'academic_record';

		if (isAcademicType) {
			const examYear = analysis.examYear ?? CURRENT_YEAR;
			const institutionName = analysis.institutionName ?? 'Unknown Institution';

			console.info('[uploadCertificateDocument] Creating academic record:', {
				applicantId,
				examYear,
				institutionName,
				certificateType: analysis.certificateType,
				hasSubjects: !!analysis.subjects?.length,
			});

			const recordResult = await createAcademicRecordFromDocument(
				applicantId,
				{
					institutionName,
					examYear,
					certificateType: analysis.certificateType,
					certificateNumber: analysis.certificateNumber,
					subjects: analysis.subjects,
					overallClassification: analysis.overallClassification,
				},
				savedDoc?.id,
			);
			if (!recordResult.success) {
				return { success: false, error: recordResult.error };
			}
		}

		return { success: true, data: { fileName, type, analysis } };
	} catch (error) {
		console.error('[uploadCertificateDocument] Error:', error);
		return { success: false, error: extractError(error) };
	}
}

export async function removeAcademicRecord(
	id: string,
): Promise<ActionResult<void>> {
	try {
		await deleteAcademicRecord(id);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}
