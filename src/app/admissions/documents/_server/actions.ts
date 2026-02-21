'use server';

import type { DocumentType, DocumentVerificationStatus } from '@/core/database';
import { documentReviewService } from './service';

export async function getDocumentsForReview(
	page: number,
	search: string,
	filters?: {
		status?: DocumentVerificationStatus;
		type?: DocumentType;
	}
) {
	return documentReviewService.findAllForReview(page, search, filters);
}

export async function getDocumentForReview(id: string) {
	return documentReviewService.findByIdWithRelations(id);
}

export async function updateDocumentRotation(id: string, rotation: number) {
	return documentReviewService.updateRotation(id, rotation);
}

export async function updateDocumentStatus(
	id: string,
	status: DocumentVerificationStatus,
	rejectionReason?: string
) {
	return documentReviewService.updateVerificationStatus(
		id,
		status,
		rejectionReason
	);
}

export async function updateApplicantField(
	applicantId: string,
	field: string,
	value: string | null
) {
	return documentReviewService.updateApplicantField(applicantId, field, value);
}

export async function updateAcademicRecordField(
	recordId: string,
	field: string,
	value: string | number | null
) {
	return documentReviewService.updateAcademicRecordField(
		recordId,
		field,
		value
	);
}

export async function updateSubjectGradeField(
	gradeId: string,
	field: 'originalGrade' | 'standardGrade',
	value: string | null
) {
	return documentReviewService.updateSubjectGradeField(gradeId, field, value);
}

export async function deleteDocument(id: string) {
	return documentReviewService.delete(id);
}

export async function acquireReviewLock(documentId: string) {
	return documentReviewService.acquireLock(documentId);
}

export async function releaseReviewLock(documentId: string) {
	return documentReviewService.releaseLock(documentId);
}

export async function releaseAllReviewLocks() {
	return documentReviewService.releaseAllLocks();
}

export async function getNextDocument(
	currentId: string,
	filters?: {
		status?: DocumentVerificationStatus;
		type?: DocumentType;
	}
) {
	return documentReviewService.findNextUnlocked(currentId, filters);
}
