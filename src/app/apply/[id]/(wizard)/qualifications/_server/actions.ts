'use server';

import { mapDocumentTypeFromAnalysis } from '@admissions/applicants/_lib/documentTypes';
import {
	createAcademicRecordFromDocument,
	saveApplicantDocument,
} from '@admissions/applicants/[id]/documents/_server/actions';
import { nanoid } from 'nanoid';
import { analyzeDocument } from '@/core/integrations/ai/documents';
import { uploadDocument } from '@/core/integrations/storage';
import { getFileExtension } from '@/shared/lib/utils/files';

export async function uploadAcademicDocument(
	applicantId: string,
	formData: FormData
) {
	const file = formData.get('file');
	if (!(file instanceof File)) {
		throw new Error('No file provided');
	}

	const folder = 'documents/admissions';
	const ext = getFileExtension(file.name);
	const fileName = `${nanoid()}${ext}`;

	await uploadDocument(file, fileName, folder);

	const buffer = await file.arrayBuffer();
	const base64 = Buffer.from(buffer).toString('base64');
	const result = await analyzeDocument(base64, file.type);

	const type = mapDocumentTypeFromAnalysis(result);

	await saveApplicantDocument({
		applicantId,
		fileName,
		type,
	});

	if (
		result.category === 'academic' &&
		(type === 'certificate' ||
			type === 'transcript' ||
			type === 'academic_record') &&
		result.examYear &&
		result.institutionName
	) {
		await createAcademicRecordFromDocument(applicantId, {
			institutionName: result.institutionName,
			qualificationName: result.qualificationName,
			examYear: result.examYear,
			certificateType: result.certificateType,
			certificateNumber: result.certificateNumber,
			subjects: result.subjects,
			overallClassification: result.overallClassification,
		});
	}

	return { fileName, type, result };
}
