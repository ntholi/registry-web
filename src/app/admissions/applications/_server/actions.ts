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
import { redirect, unauthorized } from 'next/navigation';
import { auth } from '@/core/auth';
import type {
	ApplicationStatus,
	applications,
	DocumentType,
} from '@/core/database';
import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';
import { uploadDocument } from '@/core/integrations/storage';
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

export async function uploadAndAnalyzeDocument(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id) {
		return unauthorized();
	}

	const file = formData.get('file');
	if (!(file instanceof File)) {
		throw new Error('No file provided');
	}

	const applicant = await getOrCreateApplicantForCurrentUser();
	if (!applicant) {
		throw new Error('Failed to get applicant');
	}

	const folder = 'documents/admissions';
	const fileName = `${nanoid()}${getFileExtension(file.name)}`;

	await uploadDocument(file, fileName, folder);

	const buffer = await file.arrayBuffer();
	const base64 = Buffer.from(buffer).toString('base64');
	const result = await analyzeDocumentWithAI(base64, file.type);

	const type: DocumentType = result.documentType;

	await saveApplicantDocument({
		applicantId: applicant.id,
		fileName,
		type,
		certification: result.certification,
	});

	if (result.category === 'identity' && type === 'identity') {
		await updateApplicantFromIdentity(applicant.id, {
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
		(type === 'certificate' ||
			type === 'transcript' ||
			type === 'academic_record') &&
		result.examYear &&
		result.institutionName
	) {
		await createAcademicRecordFromDocument(applicant.id, {
			institutionName: result.institutionName,

			examYear: result.examYear,
			certificateType: result.certificateType,
			certificateNumber: result.certificateNumber,
			subjects: result.subjects,
			overallClassification: result.overallClassification,
		});
	}

	const payload: {
		result: DocumentAnalysisResult;
		type: DocumentType;
		fileName: string;
	} = {
		result,
		type,
		fileName,
	};

	return payload;
}

export async function completeApplication() {
	const session = await auth();
	if (!session?.user?.id) {
		return unauthorized();
	}

	const applicant = await findApplicantByUserId(session.user.id);
	if (!applicant) {
		throw new Error('No applicant found');
	}

	redirect('/apply/courses');
}
