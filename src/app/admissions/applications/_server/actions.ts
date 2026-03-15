'use server';

import {
	findApplicantByUserId,
	getOrCreateApplicantForCurrentUser,
} from '@admissions/applicants';
import {
	analyzeDocumentWithAI,
	createAcademicRecordFromDocument,
	saveApplicantDocument,
	updateApplicantFromIdentity,
} from '@admissions/applicants/[id]/documents/_server/actions';
import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';
import type {
	ApplicationStatus,
	applications,
	DocumentType,
} from '@/core/database';
import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';
import { uploadFile } from '@/core/integrations/storage';
import {
	generateUploadKey,
	StoragePaths,
} from '@/core/integrations/storage-utils';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';
import { UserFacingError } from '@/shared/lib/utils/extractError';
import type { ApplicationFilters } from '../_lib/types';
import { applicationsService } from './service';

type Application = typeof applications.$inferInsert;

export const getApplication = createAction(async (id: string) =>
	applicationsService.get(id)
);

export const findAllApplications = createAction(
	async (page: number = 1, search: string = '', filters?: ApplicationFilters) =>
		applicationsService.search(page, search, filters)
);

export const createApplication = createAction(async (data: Application) =>
	applicationsService.create(data)
);

export const createOrUpdateApplication = createAction(
	async (data: Application) => applicationsService.createOrUpdate(data)
);

export const updateApplication = createAction(
	async (id: string, data: Application) => applicationsService.update(id, data)
);

export const deleteApplication = createAction(async (id: string) =>
	applicationsService.delete(id)
);

export const changeApplicationStatus = createAction(
	async (
		applicationId: string,
		newStatus: ApplicationStatus,
		notes?: string,
		rejectionReason?: string
	) =>
		applicationsService.changeStatus(
			applicationId,
			newStatus,
			notes,
			rejectionReason
		)
);

export const addApplicationNote = createAction(
	async (applicationId: string, content: string) =>
		applicationsService.addNote(applicationId, content)
);

export const getApplicationNotes = createAction(async (applicationId: string) =>
	applicationsService.getNotes(applicationId)
);

export const findApplicationsByApplicant = createAction(
	async (applicantId: string) =>
		applicationsService.findByApplicant(applicantId)
);

export const countApplicationsByStatus = createAction(
	async (status: ApplicationStatus) => applicationsService.countByStatus(status)
);

export const countPendingApplications = createAction(async () =>
	applicationsService.countPending()
);

export const getApplicationForPayment = createAction(
	async (applicationId: string) =>
		applicationsService.getForPayment(applicationId)
);

export const recalculateApplicationScores = createAction(
	async (applicationId: string) =>
		applicationsService.recalculateScores(applicationId)
);

export const recalculateScoresForApplicant = createAction(
	async (applicantId: string) =>
		applicationsService.recalculateScoresForApplicant(applicantId)
);

export const uploadAndAnalyzeDocument = createAction(
	async (formData: FormData) => {
		const session = await auth();
		if (!session?.user?.id) {
			throw new UserFacingError('Unauthorized');
		}

		const file = formData.get('file');
		if (!(file instanceof File)) {
			throw new UserFacingError('No file provided');
		}

		const applicant = unwrap(await getOrCreateApplicantForCurrentUser());
		if (!applicant) {
			throw new UserFacingError('Failed to get applicant');
		}

		const fileKey = generateUploadKey(
			(fileName) => StoragePaths.applicantDocument(applicant.id, fileName),
			file.name
		);

		await uploadFile(file, fileKey);

		const buffer = await file.arrayBuffer();
		const base64 = Buffer.from(buffer).toString('base64');
		const analysisResult = unwrap(
			await analyzeDocumentWithAI(base64, file.type)
		);
		if (!analysisResult.success) {
			throw new UserFacingError(analysisResult.error);
		}
		const analysis = analysisResult.data;

		const type: DocumentType = analysis.documentType;

		const savedDoc = unwrap(
			await saveApplicantDocument({
				applicantId: applicant.id,
				fileName: file.name,
				fileUrl: fileKey,
				type,
			})
		);

		if (analysis.category === 'identity' && type === 'identity') {
			unwrap(
				await updateApplicantFromIdentity(applicant.id, {
					fullName: analysis.fullName,
					dateOfBirth: analysis.dateOfBirth,
					nationalId: analysis.nationalId,
					nationality: analysis.nationality,
					gender: analysis.gender,
					birthPlace: analysis.birthPlace,
					address: analysis.address,
				})
			);
		}

		if (
			analysis.category === 'academic' &&
			(type === 'certificate' || type === 'academic_record') &&
			analysis.examYear &&
			analysis.institutionName
		) {
			unwrap(
				await createAcademicRecordFromDocument(
					applicant.id,
					{
						institutionName: analysis.institutionName,
						examYear: analysis.examYear,
						certificateType: analysis.certificateType,
						certificateNumber: analysis.certificateNumber,
						candidateNumber: analysis.candidateNumber,
						subjects: analysis.subjects,
						overallClassification: analysis.overallClassification,
					},
					savedDoc?.document?.id
				)
			);
		}

		const payload: {
			result: DocumentAnalysisResult;
			type: DocumentType;
			fileName: string;
		} = {
			result: analysis,
			type,
			fileName: file.name,
		};

		return payload;
	}
);

export const completeApplication = createAction(async () => {
	const session = await auth();
	if (!session?.user?.id) {
		throw new UserFacingError('Unauthorized');
	}

	const applicant = unwrap(await findApplicantByUserId(session.user.id));
	if (!applicant) {
		throw new UserFacingError('No applicant found');
	}

	redirect('/apply/courses');
});
