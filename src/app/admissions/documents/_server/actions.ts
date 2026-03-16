'use server';

import type { DocumentType, DocumentVerificationStatus } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
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

export async function countPendingDocumentsForReview() {
	return documentReviewService.countPending();
}

export const updateDocumentRotation = createAction(
	async (id: string, rotation: number) =>
		documentReviewService.updateRotation(id, rotation)
);

export const updateDocumentStatus = createAction(
	async (
		id: string,
		status: DocumentVerificationStatus,
		rejectionReason?: string
	) =>
		documentReviewService.updateVerificationStatus(id, status, rejectionReason)
);

export const updateApplicantField = createAction(
	async (applicantId: string, field: string, value: string | null) =>
		documentReviewService.updateApplicantField(applicantId, field, value)
);

export const updateAcademicRecordField = createAction(
	async (recordId: string, field: string, value: string | number | null) =>
		documentReviewService.updateAcademicRecordField(recordId, field, value)
);

export const updateSubjectGradeField = createAction(
	async (
		gradeId: string,
		field: 'originalGrade' | 'standardGrade',
		value: string | null
	) => documentReviewService.updateSubjectGradeField(gradeId, field, value)
);

export const deleteDocument = createAction(async (id: string) =>
	documentReviewService.delete(id)
);

export const acquireReviewLock = createAction(async (documentId: string) =>
	documentReviewService.acquireLock(documentId)
);

export const releaseReviewLock = createAction(async (documentId: string) =>
	documentReviewService.releaseLock(documentId)
);

export const releaseAllReviewLocks = createAction(async () =>
	documentReviewService.releaseAllLocks()
);

export async function getNextDocument(
	currentId: string,
	filters?: {
		status?: DocumentVerificationStatus;
		type?: DocumentType;
	}
) {
	return documentReviewService.findNextUnlocked(currentId, filters);
}
