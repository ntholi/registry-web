'use server';

import { getOrCreateApplicantForCurrentUser } from '@admissions/applicants';
import { findCertificateTypeByName } from '@admissions/applicants/_server/document-actions';
import {
	createAcademicRecord,
	deleteAcademicRecord,
} from '@admissions/applicants/[id]/academic-records/_server/actions';
import {
	createAcademicRecordFromDocument,
	saveApplicantDocument,
} from '@admissions/applicants/[id]/documents/_server/actions';
import { getApplication } from '@admissions/applications';
import { type ActionResult, extractError } from '@apply/_lib/errors';
import { getStudentByUserId } from '@registry/students';
import { nanoid } from 'nanoid';
import { auth } from '@/core/auth';
import type { CertificateDocumentResult } from '@/core/integrations/ai/documents';
import { uploadDocument } from '@/core/integrations/storage';
import { getFileExtension } from '@/shared/lib/utils/files';
import {
	getAcademicRemarks,
	getResultClassificationFromCgpa,
} from '@/shared/lib/utils/grades';
import type { Program as GradeProgram } from '@/shared/lib/utils/grades/type';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const CURRENT_YEAR = new Date().getFullYear();

type UploadResult = {
	fileName: string;
	type: string;
	analysis: CertificateDocumentResult;
};

function extractYear(value: string | null | undefined) {
	if (!value) return undefined;
	const match = value.match(/\d{4}/);
	if (!match) return undefined;
	const year = Number.parseInt(match[0] ?? '', 10);
	return Number.isNaN(year) ? undefined : year;
}

export async function prepopulateAcademicRecordsFromCompletedPrograms(
	applicationId: string
): Promise<ActionResult<number>> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, error: 'Unauthorized' };
		}

		const application = await getApplication(applicationId);
		if (!application) {
			return { success: false, error: 'Application not found' };
		}

		const applicant = await getOrCreateApplicantForCurrentUser();
		if (!applicant || applicant.id !== application.applicantId) {
			return { success: false, error: 'Applicant not found' };
		}

		const student = await getStudentByUserId(session.user.id);
		if (!student) {
			return { success: true, data: 0 };
		}

		const completedPrograms = student.programs.filter(
			(program) => program.status === 'Completed'
		);
		if (completedPrograms.length === 0) {
			return { success: true, data: 0 };
		}

		const existingKeys = new Set(
			applicant.academicRecords.map(
				(record) =>
					`${record.certificateTypeId}:${record.qualificationName ?? ''}`
			)
		);

		let createdCount = 0;
		for (const program of completedPrograms) {
			const certType = await findCertificateTypeByName(
				program.structure.program.level
			);
			if (!certType) continue;

			const qualificationName = program.structure.program.name;
			const key = `${certType.id}:${qualificationName}`;
			if (existingKeys.has(key)) continue;

			const examYear =
				extractYear(program.graduationDate) ??
				extractYear(program.intakeDate) ??
				CURRENT_YEAR;

			const isLevel4 = certType.lqfLevel === 4;
			const academicRemarks = getAcademicRemarks([program as GradeProgram]);
			const resultClassification = getResultClassificationFromCgpa(
				academicRemarks.latestPoints?.cgpa
			);

			await createAcademicRecord(
				applicant.id,
				{
					certificateTypeId: certType.id,
					examYear,
					institutionName: 'Limkokwing University of Creative Technology',
					qualificationName,
					certificateNumber: null,
					candidateNumber: null,
					resultClassification,
				},
				isLevel4
			);

			existingKeys.add(key);
			createdCount += 1;
		}

		return { success: true, data: createdCount };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}

export async function uploadCertificateDocument(
	applicantId: string,
	file: File,
	analysis: CertificateDocumentResult
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

		const isAcademicType = type === 'certificate' || type === 'academic_record';

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
					qualificationName: analysis.qualificationName,
				},
				savedDoc?.id
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
	id: string
): Promise<ActionResult<void>> {
	try {
		await deleteAcademicRecord(id);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractError(error) };
	}
}
