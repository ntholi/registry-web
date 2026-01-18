'use server';

import { getApplicant, updateApplicant } from '@admissions/applicants';
import { findAllCertificateTypes } from '@admissions/certificate-types';
import { findOrCreateSubjectByName } from '@admissions/subjects';
import type { DocumentType, DocumentVerificationStatus } from '@/core/database';
import {
	analyzeDocument,
	type DocumentAnalysisResult,
} from '@/core/integrations/ai';
import { deleteDocument } from '@/core/integrations/storage';
import type { SubjectGradeInput } from '../../academic-records/_lib/types';
import { createAcademicRecord } from '../../academic-records/_server/actions';
import type {
	ExtractedAcademicData,
	ExtractedIdentityData,
} from '../_lib/types';
import { applicantDocumentsService } from './service';

const BASE_URL = 'https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev';

export async function getDocumentFolder(applicantId: string) {
	return `documents/admissions/applicants/${applicantId}`;
}

export async function getApplicantDocument(id: string) {
	return applicantDocumentsService.get(id);
}

export async function findDocumentsByApplicant(applicantId: string, page = 1) {
	return applicantDocumentsService.findByApplicant(applicantId, page);
}

export async function findDocumentsByType(
	applicantId: string,
	type: DocumentType
) {
	return applicantDocumentsService.findByType(applicantId, type);
}

export async function saveApplicantDocument(data: {
	applicantId: string;
	fileName: string;
	type: DocumentType;
}) {
	const folder = await getDocumentFolder(data.applicantId);
	const fileUrl = `${BASE_URL}/${folder}/${data.fileName}`;

	return applicantDocumentsService.uploadDocument(
		{
			fileName: data.fileName,
			fileUrl,
			type: data.type,
		},
		data.applicantId,
		0
	);
}

export async function verifyApplicantDocument(
	id: string,
	status: DocumentVerificationStatus,
	rejectionReason?: string
) {
	return applicantDocumentsService.verifyDocument(id, status, rejectionReason);
}

export async function deleteApplicantDocument(id: string, fileUrl: string) {
	const key = fileUrl.replace(`${BASE_URL}/`, '');
	await deleteDocument(key);
	return applicantDocumentsService.delete(id);
}

export async function analyzeDocumentWithAI(
	fileBase64: string,
	mediaType: string
): Promise<DocumentAnalysisResult> {
	return analyzeDocument(fileBase64, mediaType);
}

export async function reanalyzeDocumentFromUrl(
	fileUrl: string,
	applicantId: string,
	documentType: DocumentType
): Promise<DocumentAnalysisResult> {
	const response = await fetch(fileUrl);
	if (!response.ok) {
		throw new Error('Failed to fetch document');
	}
	const buffer = await response.arrayBuffer();
	const base64 = Buffer.from(buffer).toString('base64');
	const contentType = response.headers.get('content-type') ?? 'application/pdf';
	const result = await analyzeDocument(base64, contentType);

	if (result.category === 'identity' && documentType === 'identity') {
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

	if (
		result.category === 'academic' &&
		(documentType === 'certificate' ||
			documentType === 'transcript' ||
			documentType === 'academic_record') &&
		result.examYear &&
		result.institutionName
	) {
		await createAcademicRecordFromDocument(applicantId, {
			institutionName: result.institutionName,
			qualificationName: result.qualificationName,
			examYear: result.examYear,
			certificateType: result.certificateType,
			subjects: result.subjects,
			overallClassification: result.overallClassification,
		});
	}

	return result;
}

export async function updateApplicantFromIdentity(
	applicantId: string,
	data: ExtractedIdentityData
) {
	const applicant = await getApplicant(applicantId);
	if (!applicant) {
		throw new Error('Applicant not found');
	}

	const updateData: Partial<typeof applicant> = {};

	if (data.fullName && data.fullName !== applicant.fullName) {
		updateData.fullName = data.fullName;
	}
	if (data.dateOfBirth && data.dateOfBirth !== applicant.dateOfBirth) {
		updateData.dateOfBirth = data.dateOfBirth;
	}
	if (data.nationalId && data.nationalId !== applicant.nationalId) {
		updateData.nationalId = data.nationalId;
	}
	if (data.nationality && data.nationality !== applicant.nationality) {
		updateData.nationality = data.nationality;
	}
	if (data.gender && data.gender !== applicant.gender) {
		updateData.gender = data.gender;
	}
	if (data.birthPlace && data.birthPlace !== applicant.birthPlace) {
		updateData.birthPlace = data.birthPlace;
	}
	if (data.address && data.address !== applicant.address) {
		updateData.address = data.address;
	}

	if (Object.keys(updateData).length > 0) {
		return updateApplicant(applicantId, { ...applicant, ...updateData });
	}

	return applicant;
}

export async function createAcademicRecordFromDocument(
	applicantId: string,
	data: ExtractedAcademicData
) {
	if (!data.examYear || !data.institutionName) {
		throw new Error('Exam year and institution name are required');
	}

	let certificateTypeId: number | null = null;

	if (data.certificateType) {
		const { items: certTypes } = await findAllCertificateTypes(1, '');
		const normalizedSearchType = data.certificateType.toLowerCase().trim();

		const matchedType = certTypes.find((ct) => {
			const normalizedName = ct.name.toLowerCase().trim();
			return (
				normalizedName === normalizedSearchType ||
				normalizedName.includes(normalizedSearchType) ||
				normalizedSearchType.includes(normalizedName)
			);
		});

		if (matchedType) {
			certificateTypeId = matchedType.id;
		}
	}

	if (!certificateTypeId) {
		const { items: certTypes } = await findAllCertificateTypes(1, '');
		if (certTypes.length > 0) {
			certificateTypeId = certTypes[0].id;
		} else {
			throw new Error('No certificate types found in the system');
		}
	}

	let subjectGrades: SubjectGradeInput[] | undefined;
	if (data.subjects && data.subjects.length > 0) {
		subjectGrades = await Promise.all(
			data.subjects.map(async (sub) => {
				const subject = await findOrCreateSubjectByName(sub.name);
				return {
					subjectId: subject.id,
					originalGrade: sub.grade,
				};
			})
		);
	}

	const isLevel4 = !!(subjectGrades && subjectGrades.length > 0);

	return createAcademicRecord(
		applicantId,
		{
			certificateTypeId,
			examYear: data.examYear,
			institutionName: data.institutionName,
			qualificationName: data.qualificationName,
			resultClassification: data.overallClassification,
			subjectGrades,
		},
		isLevel4
	);
}
