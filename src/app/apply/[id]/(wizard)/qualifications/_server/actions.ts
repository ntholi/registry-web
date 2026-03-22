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
import { MAX_FILE_SIZE } from '@apply/_lib/constants';
import { getStudentByUserId } from '@registry/students';
import { auth } from '@/core/auth';
import type { CertificateDocumentResult } from '@/core/integrations/ai/documents';
import { uploadFile } from '@/core/integrations/storage';
import {
	generateUploadKey,
	StoragePaths,
} from '@/core/integrations/storage-utils';
import { createAction, unwrap } from '@/shared/lib/actions/actionResult';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import {
	getAcademicRemarks,
	getResultClassificationFromCgpa,
} from '@/shared/lib/utils/grades';
import type { Program as GradeProgram } from '@/shared/lib/utils/grades/type';

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

export const prepopulateAcademicRecordsFromCompletedPrograms = createAction(
	async (applicationId: string) => {
		const session = await auth();
		if (!session?.user?.id) {
			throw new UserFacingError('Unauthorized');
		}

		const application = await getApplication(applicationId);
		if (!application) {
			throw new UserFacingError('Application not found');
		}

		const applicant = unwrap(await getOrCreateApplicantForCurrentUser());
		if (!applicant || applicant.id !== application.applicantId) {
			throw new UserFacingError('Applicant not found');
		}

		const student = await getStudentByUserId(session.user.id);
		if (!student) {
			return 0;
		}

		const completedPrograms = student.programs.filter(
			(program) => program.status === 'Completed'
		);
		if (completedPrograms.length === 0) {
			return 0;
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
			if (!certType) {
				continue;
			}

			const qualificationName = program.structure.program.name;
			const key = `${certType.id}:${qualificationName}`;
			if (existingKeys.has(key)) {
				continue;
			}

			const examYear =
				extractYear(program.graduationDate) ??
				extractYear(program.intakeDate) ??
				new Date().getFullYear();

			const academicRemarks = getAcademicRemarks([program as GradeProgram]);
			const resultClassification = getResultClassificationFromCgpa(
				academicRemarks.latestPoints?.cgpa
			);

			unwrap(
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
					certType.lqfLevel === 4
				)
			);

			existingKeys.add(key);
			createdCount += 1;
		}

		return createdCount;
	}
);

export const uploadCertificateDocument = createAction(
	async (
		applicantId: string,
		file: File,
		analysis: CertificateDocumentResult
	): Promise<UploadResult> => {
		if (file.size > MAX_FILE_SIZE) {
			throw new UserFacingError('File size exceeds 2MB limit');
		}

		const fileKey = generateUploadKey(
			(fileName) => StoragePaths.applicantDocument(applicantId, fileName),
			file.name
		);

		await uploadFile(file, fileKey);

		const type = analysis.documentType;
		const savedDoc = unwrap(
			await saveApplicantDocument({
				applicantId,
				fileName: file.name,
				fileUrl: fileKey,
				type,
			})
		);

		if (type === 'certificate' || type === 'academic_record') {
			unwrap(
				await createAcademicRecordFromDocument(
					applicantId,
					{
						institutionName: analysis.institutionName ?? 'Unknown Institution',
						examYear: analysis.examYear ?? new Date().getFullYear(),
						certificateType: analysis.certificateType,
						certificateNumber: analysis.certificateNumber,
						subjects: analysis.subjects,
						overallClassification: analysis.overallClassification,
						qualificationName: analysis.qualificationName,
					},
					savedDoc?.id
				)
			);
		}

		return { fileName: file.name, type, analysis };
	}
);

export const removeAcademicRecord = createAction(async (id: string) => {
	unwrap(await deleteAcademicRecord(id));
});
