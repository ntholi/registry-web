'use server';

import { mapDocumentTypeFromAnalysis } from '@admissions/applicants/_lib/documentTypes';
import {
	saveApplicantDocument,
	updateApplicantFromIdentity,
} from '@admissions/applicants/[id]/documents/_server/actions';
import { nanoid } from 'nanoid';
import type { DocumentAnalysisResult } from '@/core/integrations/ai';
import { analyzeDocument } from '@/core/integrations/ai';
import { uploadDocument } from '@/core/integrations/storage';

export async function uploadIdentityDocument(
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

	if (result.category === 'identity' && type === 'identity') {
		await updateApplicantFromIdentity(applicantId, {
			fullName: result.fullName,
			dateOfBirth: result.dateOfBirth,
			nationalId: result.nationalId,
			nationality: result.nationality,
			gender: result.gender,
			birthPlace: result.birthPlace,
			address: result.address,
		});
	}

	return { fileName, type, result };
}

export async function analyzeDocumentWithAI(
	fileBase64: string,
	mediaType: string
): Promise<DocumentAnalysisResult> {
	return analyzeDocument(fileBase64, mediaType);
}

function getFileExtension(name: string) {
	const idx = name.lastIndexOf('.');
	if (idx === -1 || idx === name.length - 1) return '';
	return name.slice(idx);
}
