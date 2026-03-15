'use server';

import type { DocumentType, DocumentVerificationStatus } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { documentReviewService } from './service';

export const getDocumentsForReview = createAction(
	async (
		page: number,
		search: string,
		filters?: {
			status?: DocumentVerificationStatus;
			type?: DocumentType;
		}
	) => {
		return documentReviewService.findAllForReview(page, search, filters);
	}
);

export const getDocumentForReview = createAction(async (id: string) => {
	return documentReviewService.findByIdWithRelations(id);
});

export const countPendingDocumentsForReview = createAction(async () => {
	return documentReviewService.countPending();
});

export const updateDocumentRotation = createAction(
	async (id: string, rotation: number) => {
		return documentReviewService.updateRotation(id, rotation);
	}
);

export const updateDocumentStatus = createAction(
	async (
		id: string,
		status: DocumentVerificationStatus,
		rejectionReason?: string
	) => {
		return documentReviewService.updateVerificationStatus(
			id,
			status,
			rejectionReason
		);
	}
);

export const updateApplicantField = createAction(
	async (applicantId: string, field: string, value: string | null) => {
		return documentReviewService.updateApplicantField(
			applicantId,
			field,
			value
		);
	}
);

export const updateAcademicRecordField = createAction(
	async (recordId: string, field: string, value: string | number | null) => {
		return documentReviewService.updateAcademicRecordField(
			recordId,
			field,
			value
		);
	}
);

export const updateSubjectGradeField = createAction(
	async (
		gradeId: string,
		field: 'originalGrade' | 'standardGrade',
		value: string | null
	) => {
		return documentReviewService.updateSubjectGradeField(gradeId, field, value);
	}
);

export const deleteDocument = createAction(async (id: string) => {
	return documentReviewService.delete(id);
});

export const acquireReviewLock = createAction(async (documentId: string) => {
	return documentReviewService.acquireLock(documentId);
});

export const releaseReviewLock = createAction(async (documentId: string) => {
	return documentReviewService.releaseLock(documentId);
});

export const releaseAllReviewLocks = createAction(async () => {
	return documentReviewService.releaseAllLocks();
});

export const getNextDocument = createAction(
	async (
		currentId: string,
		filters?: {
			status?: DocumentVerificationStatus;
			type?: DocumentType;
		}
	) => {
		return documentReviewService.findNextUnlocked(currentId, filters);
	}
);
