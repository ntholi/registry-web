'use server';

import { getApplicant, updateApplicant } from '@admissions/applicants';
import { findAllCertificateTypes } from '@admissions/certificate-types';
import { findOrCreateSubjectByName } from '@admissions/subjects';
import type { DocumentType, DocumentVerificationStatus } from '@/core/database';
import {
	type AnalysisResult,
	analyzeDocument,
	type DocumentAnalysisResult,
} from '@/core/integrations/ai/documents';
import { deleteFile, uploadFile } from '@/core/integrations/storage';
import {
	generateUploadKey,
	getPublicUrl,
	StoragePaths,
} from '@/core/integrations/storage-utils';
import { createAction, unwrap } from '@/shared/lib/actions/actionResult';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import { normalizeNationality } from '@/shared/lib/utils/countries';
import { normalizeResultClassification } from '@/shared/lib/utils/resultClassification';
import type { SubjectGradeInput } from '../../academic-records/_lib/types';
import {
	createAcademicRecord,
	deleteAcademicRecordInternal,
	findAcademicRecordByApplicantDocumentId,
	findAcademicRecordByCertificateNumber,
	linkDocumentToAcademicRecord,
	updateAcademicRecord,
} from '../../academic-records/_server/actions';
import type {
	ExtractedAcademicData,
	ExtractedIdentityData,
} from '../_lib/types';
import { applicantDocumentsService } from './service';

function normalizeFileUrl(fileUrl: string) {
	if (!fileUrl) {
		throw new UserFacingError('Document URL is missing');
	}

	try {
		return new URL(fileUrl).toString();
	} catch {
		return encodeURI(fileUrl);
	}
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

export const saveApplicantDocument = createAction(
	async (data: {
		applicantId: string;
		fileName: string;
		fileUrl: string;
		type: DocumentType;
	}) =>
		applicantDocumentsService.uploadDocument(
			{
				fileName: data.fileName,
				fileUrl: data.fileUrl,
				type: data.type,
			},
			data.applicantId,
			0
		)
);

export const uploadApplicantFile = createAction(
	async (applicantId: string, file: File) => {
		const key = generateUploadKey(
			(fileName) => StoragePaths.applicantDocument(applicantId, fileName),
			file.name
		);
		await uploadFile(file, key);
		return key;
	}
);

export const verifyApplicantDocument = createAction(
	async (
		id: string,
		status: DocumentVerificationStatus,
		rejectionReason?: string
	) => applicantDocumentsService.verifyDocument(id, status, rejectionReason)
);

export const deleteApplicantDocument = createAction(
	async (id: string, fileUrl: string) => {
		const linkedRecord = await findAcademicRecordByApplicantDocumentId(id);
		if (linkedRecord) {
			unwrap(
				await deleteAcademicRecordInternal(linkedRecord.id, {
					skipRelatedDocumentDelete: true,
				})
			);
		}

		await deleteFile(fileUrl);
		return applicantDocumentsService.delete(id);
	}
);

export async function analyzeDocumentWithAI(
	fileBase64: string,
	mediaType: string
): Promise<AnalysisResult<DocumentAnalysisResult>> {
	return analyzeDocument(fileBase64, mediaType);
}

export const reanalyzeDocumentFromUrl = createAction(
	async (fileUrl: string, applicantId: string, documentType: DocumentType) => {
		const normalizedUrl = normalizeFileUrl(fileUrl);
		const response = await fetch(getPublicUrl(normalizedUrl), {
			cache: 'no-store',
		});
		if (!response.ok) {
			throw new UserFacingError(
				`Failed to fetch document (${response.status})`
			);
		}
		const buffer = await response.arrayBuffer();
		const base64 = Buffer.from(buffer).toString('base64');
		const contentType =
			response.headers.get('content-type') ?? 'application/pdf';
		const result = await analyzeDocument(base64, contentType);
		if (!result.success) {
			throw new UserFacingError(result.error);
		}
		const data = result.data;

		if (data.category === 'identity' && documentType === 'identity') {
			unwrap(
				await updateApplicantFromIdentity(applicantId, {
					fullName: data.fullName,
					dateOfBirth: data.dateOfBirth,
					nationalId: data.nationalId,
					nationality: data.nationality,
					gender: data.gender,
					birthPlace: data.birthPlace,
					address: data.address,
				})
			);
		}

		if (
			data.category === 'academic' &&
			(documentType === 'certificate' || documentType === 'academic_record') &&
			data.examYear &&
			data.institutionName
		) {
			unwrap(
				await createAcademicRecordFromDocument(applicantId, {
					institutionName: data.institutionName,
					examYear: data.examYear,
					certificateType: data.certificateType,
					certificateNumber: data.certificateNumber,
					candidateNumber: data.candidateNumber,
					subjects: data.subjects,
					overallClassification: data.overallClassification,
				})
			);
		}

		return data;
	}
);

export const updateApplicantFromIdentity = createAction(
	async (applicantId: string, data: ExtractedIdentityData) => {
		const applicant = await getApplicant(applicantId);
		if (!applicant) {
			throw new UserFacingError('Applicant not found');
		}

		const updateData: Partial<ExtractedIdentityData> = {};

		if (data.fullName && data.fullName !== applicant.fullName) {
			updateData.fullName = data.fullName;
		}
		if (data.dateOfBirth && data.dateOfBirth !== applicant.dateOfBirth) {
			updateData.dateOfBirth = data.dateOfBirth;
		}
		if (data.nationalId && data.nationalId !== applicant.nationalId) {
			updateData.nationalId = data.nationalId;
		}
		const normalized = normalizeNationality(data.nationality);
		if (normalized && normalized !== applicant.nationality) {
			updateData.nationality = normalized;
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
			unwrap(
				await updateApplicant(applicantId, {
					id: applicant.id,
					userId: applicant.userId,
					fullName: updateData.fullName ?? applicant.fullName,
					dateOfBirth: updateData.dateOfBirth ?? applicant.dateOfBirth,
					nationalId: updateData.nationalId ?? applicant.nationalId,
					nationality: updateData.nationality ?? applicant.nationality,
					birthPlace: updateData.birthPlace ?? applicant.birthPlace,
					religion: applicant.religion,
					address: updateData.address ?? applicant.address,
					gender: updateData.gender ?? applicant.gender,
					createdAt: applicant.createdAt,
					updatedAt: applicant.updatedAt,
				})
			);
			const refreshed = await getApplicant(applicantId);
			if (!refreshed) {
				throw new UserFacingError('Applicant not found');
			}
			return refreshed;
		}

		return applicant;
	}
);

export const createAcademicRecordFromDocument = createAction(
	async (
		applicantId: string,
		data: ExtractedAcademicData,
		applicantDocumentId?: string
	) => {
		const examYear = data.examYear ?? new Date().getFullYear();
		const institutionName = data.institutionName ?? 'Unknown Institution';

		let certificateTypeId: string | null = null;
		let certLqfLevel = 4;

		const { items: certTypes } = await findAllCertificateTypes(1, '');

		if (data.certificateType) {
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
				certLqfLevel = matchedType.lqfLevel;
			}
		}

		if (!certificateTypeId) {
			if (certTypes.length > 0) {
				certificateTypeId = certTypes[0].id;
				certLqfLevel = certTypes[0].lqfLevel;
			} else {
				throw new UserFacingError('No certificate types found in the system');
			}
		}

		let subjectGrades: SubjectGradeInput[] | undefined;
		if (data.subjects && data.subjects.length > 0) {
			subjectGrades = await Promise.all(
				data.subjects.map(async (sub) => {
					const subject = unwrap(await findOrCreateSubjectByName(sub.name));
					return {
						subjectId: subject.id,
						originalGrade: sub.grade,
					};
				})
			);
		}

		const isLevel4 = certLqfLevel === 4;
		const normalizedClassification = normalizeResultClassification(
			data.overallClassification
		);

		if (data.certificateNumber) {
			const existing = await findAcademicRecordByCertificateNumber(
				data.certificateNumber
			);
			if (existing) {
				const record = unwrap(
					await updateAcademicRecord(
						existing.id,
						{
							certificateTypeId,
							examYear,
							institutionName,
							qualificationName: data.qualificationName,
							certificateNumber: data.certificateNumber,
							resultClassification: normalizedClassification,
							subjectGrades,
							candidateNumber: data.candidateNumber,
						},
						isLevel4
					)
				);
				if (applicantDocumentId && record) {
					unwrap(
						await linkDocumentToAcademicRecord(record.id, applicantDocumentId)
					);
				}
				return record;
			}
		}

		return unwrap(
			await createAcademicRecord(
				applicantId,
				{
					certificateTypeId,
					examYear,
					institutionName,
					qualificationName: data.qualificationName,
					certificateNumber: data.certificateNumber,
					resultClassification: normalizedClassification,
					subjectGrades,
					candidateNumber: data.candidateNumber,
				},
				isLevel4,
				applicantDocumentId
			)
		);
	}
);
