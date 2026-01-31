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
import { nanoid } from 'nanoid';
import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';
import type {
	ApplicationStatus,
	applications,
	DocumentType,
} from '@/core/database';
import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';
import { uploadDocument } from '@/core/integrations/storage';
import {
	type ActionResult,
	failure,
	success,
} from '@/shared/lib/utils/actionResult';
import type { ApplicationFilters } from '../_lib/types';
import { applicationsService } from './service';

type Application = typeof applications.$inferInsert;

export async function getApplication(id: string) {
	return applicationsService.get(id);
}

export async function findAllApplications(
	page = 1,
	search = '',
	filters?: ApplicationFilters
) {
	return applicationsService.search(page, search, filters);
}

export async function createApplication(data: Application) {
	return applicationsService.create(data);
}

export async function createOrUpdateApplication(data: Application) {
	return applicationsService.createOrUpdate(data);
}

export async function updateApplication(id: string, data: Application) {
	return applicationsService.update(id, data);
}

export async function deleteApplication(id: string) {
	return applicationsService.delete(id);
}

export async function changeApplicationStatus(
	applicationId: string,
	newStatus: ApplicationStatus,
	notes?: string,
	rejectionReason?: string
) {
	return applicationsService.changeStatus(
		applicationId,
		newStatus,
		notes,
		rejectionReason
	);
}

export async function addApplicationNote(
	applicationId: string,
	content: string
) {
	return applicationsService.addNote(applicationId, content);
}

export async function getApplicationNotes(applicationId: string) {
	return applicationsService.getNotes(applicationId);
}

export async function recordApplicationPayment(
	applicationId: string,
	receiptId: string
) {
	return applicationsService.recordPayment(applicationId, receiptId);
}

export async function getApplicationPaymentInfo(applicationId: string) {
	return applicationsService.getPaymentInfo(applicationId);
}

export async function findApplicationsByApplicant(applicantId: string) {
	return applicationsService.findByApplicant(applicantId);
}

export async function countApplicationsByStatus(status: ApplicationStatus) {
	return applicationsService.countByStatus(status);
}

export async function countPendingApplications() {
	return applicationsService.countPending();
}

export async function getApplicationForPayment(applicationId: string) {
	return applicationsService.getForPayment(applicationId);
}

function getFileExtension(name: string) {
	const idx = name.lastIndexOf('.');
	if (idx === -1 || idx === name.length - 1) return '';
	return name.slice(idx);
}

export async function uploadAndAnalyzeDocument(formData: FormData): Promise<
	ActionResult<{
		result: DocumentAnalysisResult;
		type: DocumentType;
		fileName: string;
	}>
> {
	const session = await auth();
	if (!session?.user?.id) {
		return failure('Unauthorized');
	}

	const file = formData.get('file');
	if (!(file instanceof File)) {
		return failure('No file provided');
	}

	const applicant = await getOrCreateApplicantForCurrentUser();
	if (!applicant) {
		return failure('Failed to get applicant');
	}

	const folder = 'documents/admissions';
	const fileName = `${nanoid()}${getFileExtension(file.name)}`;

	await uploadDocument(file, fileName, folder);

	const buffer = await file.arrayBuffer();
	const base64 = Buffer.from(buffer).toString('base64');
	const result = await analyzeDocumentWithAI(base64, file.type);
	if (!result.success) {
		return failure(result.error);
	}
	const analysis = result.data;

	const type: DocumentType = analysis.documentType;

	const savedDoc = await saveApplicantDocument({
		applicantId: applicant.id,
		fileName,
		type,
	});

	if (analysis.category === 'identity' && type === 'identity') {
		const updateResult = await updateApplicantFromIdentity(applicant.id, {
			fullName: analysis.fullName,
			dateOfBirth: analysis.dateOfBirth,
			nationalId: analysis.nationalId,
			nationality: analysis.nationality,
			gender: analysis.gender,
			birthPlace: analysis.birthPlace,
			address: analysis.address,
		});
		if (!updateResult.success) {
			return failure(updateResult.error);
		}
	}

	if (
		analysis.category === 'academic' &&
		(type === 'certificate' || type === 'academic_record') &&
		analysis.examYear &&
		analysis.institutionName
	) {
		const recordResult = await createAcademicRecordFromDocument(
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
		);
		if (!recordResult.success) {
			return failure(recordResult.error);
		}
	}

	const payload: {
		result: DocumentAnalysisResult;
		type: DocumentType;
		fileName: string;
	} = {
		result: analysis,
		type,
		fileName,
	};

	return success(payload);
}

export async function completeApplication(): Promise<ActionResult<void>> {
	const session = await auth();
	if (!session?.user?.id) {
		return failure('Unauthorized');
	}

	const applicant = await findApplicantByUserId(session.user.id);
	if (!applicant) {
		return failure('No applicant found');
	}

	redirect('/apply/courses');
	return success(undefined);
}
