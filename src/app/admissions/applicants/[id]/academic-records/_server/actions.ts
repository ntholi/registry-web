'use server';

import type { academicRecords } from '@/core/database';
import type { CreateAcademicRecordInput } from '../_lib/types';
import { academicRecordsService } from './service';

type AcademicRecord = typeof academicRecords.$inferInsert;

export async function getAcademicRecord(id: number) {
	return academicRecordsService.get(id);
}

export async function findAcademicRecordsByApplicant(
	applicantId: string,
	page = 1
) {
	return academicRecordsService.findByApplicant(applicantId, page);
}

export async function createAcademicRecord(
	applicantId: string,
	input: CreateAcademicRecordInput,
	isLevel4: boolean
) {
	const data: AcademicRecord = {
		applicantId,
		certificateTypeId: input.certificateTypeId,
		examYear: input.examYear,
		institutionName: input.institutionName,
		qualificationName: input.qualificationName,
		certificateNumber: input.certificateNumber,
		resultClassification: input.resultClassification,
	};

	return academicRecordsService.createWithGrades(
		data,
		isLevel4,
		input.subjectGrades
	);
}

export async function updateAcademicRecord(
	id: number,
	input: CreateAcademicRecordInput,
	isLevel4: boolean
) {
	const data: Partial<AcademicRecord> = {
		certificateTypeId: input.certificateTypeId,
		examYear: input.examYear,
		institutionName: input.institutionName,
		qualificationName: input.qualificationName,
		certificateNumber: input.certificateNumber,
		resultClassification: input.resultClassification,
	};

	return academicRecordsService.updateWithGrades(
		id,
		data,
		isLevel4,
		input.subjectGrades
	);
}

export async function deleteAcademicRecord(id: number) {
	return academicRecordsService.delete(id);
}
