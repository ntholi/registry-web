'use server';

import { recalculateScoresForApplicant } from '@admissions/applications/_server/actions';
import type { academicRecords } from '@/core/database';
import { deleteFile } from '@/core/integrations/storage';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';
import { normalizeResultClassification } from '@/shared/lib/utils/resultClassification';
import { applicantDocumentsService } from '../../documents/_server/service';
import type { CreateAcademicRecordInput } from '../_lib/types';
import { academicRecordsService } from './service';

type AcademicRecord = typeof academicRecords.$inferInsert;

export const getAcademicRecord = createAction(async (id: string) =>
	academicRecordsService.get(id)
);

export const findAcademicRecordsByApplicant = createAction(
	async (applicantId: string, page: number = 1) =>
		academicRecordsService.findByApplicant(applicantId, page)
);

export const createAcademicRecord = createAction(
	async (
		applicantId: string,
		input: CreateAcademicRecordInput,
		isLevel4: boolean,
		applicantDocumentId?: string
	) => {
		const data: AcademicRecord = {
			applicantId,
			certificateTypeId: input.certificateTypeId,
			examYear: input.examYear,
			institutionName: input.institutionName,
			qualificationName: input.qualificationName,
			certificateNumber: input.certificateNumber,
			candidateNumber: input.candidateNumber,
			resultClassification: normalizeResultClassification(
				input.resultClassification
			),
			applicantDocumentId,
		};

		return academicRecordsService
			.createWithGrades(data, isLevel4, input.subjectGrades)
			.then((result) => {
				recalculateScoresForApplicant(applicantId)
					.then(unwrap)
					.catch(() => {});
				return result;
			});
	}
);

export const updateAcademicRecord = createAction(
	async (id: string, input: CreateAcademicRecordInput, isLevel4: boolean) => {
		const data: Partial<AcademicRecord> = {
			certificateTypeId: input.certificateTypeId,
			examYear: input.examYear,
			institutionName: input.institutionName,
			qualificationName: input.qualificationName,
			certificateNumber: input.certificateNumber,
			candidateNumber: input.candidateNumber,
			resultClassification: normalizeResultClassification(
				input.resultClassification
			),
		};

		return academicRecordsService
			.updateWithGrades(id, data, isLevel4, input.subjectGrades)
			.then(async (result) => {
				if (result?.applicantId) {
					recalculateScoresForApplicant(result.applicantId)
						.then(unwrap)
						.catch(() => {});
				}
				return result;
			});
	}
);

export const deleteAcademicRecord = createAction(async (id: string) =>
	deleteAcademicRecordInternal(id)
);

export const deleteAcademicRecordInternal = createAction(
	async (id: string, options?: { skipRelatedDocumentDelete?: boolean }) => {
		const record = await academicRecordsService.get(id);
		const applicantId = record?.applicantId;
		const applicantDocumentId = record?.applicantDocumentId;
		const documentFileUrl = record?.applicantDocument?.document?.fileUrl;

		if (applicantDocumentId && !options?.skipRelatedDocumentDelete) {
			if (documentFileUrl) {
				await deleteFile(documentFileUrl);
			}
			await applicantDocumentsService.delete(applicantDocumentId);
		}

		const result = await academicRecordsService.delete(id);
		if (applicantId) {
			recalculateScoresForApplicant(applicantId)
				.then(unwrap)
				.catch(() => {});
		}
		return result;
	}
);

export const findAcademicRecordByApplicantDocumentId = createAction(
	async (applicantDocumentId: string) =>
		academicRecordsService.findByApplicantDocumentId(applicantDocumentId)
);

export const findAcademicRecordByCertificateNumber = createAction(
	async (certificateNumber: string) =>
		academicRecordsService.findByCertificateNumber(certificateNumber)
);

export const linkDocumentToAcademicRecord = createAction(
	async (academicRecordId: string, applicantDocumentId: string) =>
		academicRecordsService.linkDocument(academicRecordId, applicantDocumentId)
);
