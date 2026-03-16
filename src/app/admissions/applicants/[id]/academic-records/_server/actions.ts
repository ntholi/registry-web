'use server';

import { recalculateScoresForApplicant } from '@admissions/applications/_server/actions';
import type { academicRecords } from '@/core/database';
import { deleteFile } from '@/core/integrations/storage';
import { createAction, unwrap } from '@/shared/lib/actions/actionResult';
import { normalizeResultClassification } from '@/shared/lib/utils/resultClassification';
import { applicantDocumentsService } from '../../documents/_server/service';
import type { CreateAcademicRecordInput } from '../_lib/types';
import { academicRecordsService } from './service';

type AcademicRecord = typeof academicRecords.$inferInsert;

export async function getAcademicRecord(id: string) {
	return academicRecordsService.get(id);
}

export async function findAcademicRecordsByApplicant(
	applicantId: string,
	page = 1
) {
	return academicRecordsService.findByApplicant(applicantId, page);
}

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

		const result = await academicRecordsService.createWithGrades(
			data,
			isLevel4,
			input.subjectGrades
		);
		void recalculateScoresForApplicant(applicantId)
			.then(unwrap)
			.catch(() => {});
		return result;
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

		const result = await academicRecordsService.updateWithGrades(
			id,
			data,
			isLevel4,
			input.subjectGrades
		);
		if (result?.applicantId) {
			void recalculateScoresForApplicant(result.applicantId)
				.then(unwrap)
				.catch(() => {});
		}
		return result;
	}
);

export const deleteAcademicRecord = createAction(async (id: string) =>
	unwrap(await deleteAcademicRecordInternal(id))
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
			void recalculateScoresForApplicant(applicantId)
				.then(unwrap)
				.catch(() => {});
		}
		return result;
	}
);

export async function findAcademicRecordByApplicantDocumentId(
	applicantDocumentId: string
) {
	return academicRecordsService.findByApplicantDocumentId(applicantDocumentId);
}

export async function findAcademicRecordByCertificateNumber(
	certificateNumber: string
) {
	return academicRecordsService.findByCertificateNumber(certificateNumber);
}

export const linkDocumentToAcademicRecord = createAction(
	async (academicRecordId: string, applicantDocumentId: string) =>
		academicRecordsService.linkDocument(academicRecordId, applicantDocumentId)
);
