import type { PermissionRequirement } from '@/core/auth/permissions';
import type {
	applicantDocuments,
	DocumentType,
	DocumentVerificationStatus,
} from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import DocumentReviewRepository from './repository';

const DOCUMENT_REVIEW_READ_AUTH: PermissionRequirement = {
	'admissions-documents': ['read'],
};

const DOCUMENT_REVIEW_UPDATE_AUTH: PermissionRequirement = {
	'admissions-documents': ['update'],
};

const DOCUMENT_REVIEW_DELETE_AUTH: PermissionRequirement = {
	'admissions-documents': ['delete'],
};

class DocumentReviewService extends BaseService<
	typeof applicantDocuments,
	'id'
> {
	private repo: DocumentReviewRepository;

	constructor() {
		const repo = new DocumentReviewRepository();
		super(repo, {
			byIdAuth: DOCUMENT_REVIEW_READ_AUTH,
			findAllAuth: DOCUMENT_REVIEW_READ_AUTH,
			updateAuth: DOCUMENT_REVIEW_UPDATE_AUTH,
			deleteAuth: DOCUMENT_REVIEW_DELETE_AUTH,
			activityTypes: {
				create: 'applicant_document_uploaded',
				update: 'applicant_document_reviewed',
				delete: 'applicant_document_deleted',
			},
		});
		this.repo = repo;
	}

	async findAllForReview(
		page: number,
		search: string,
		filters?: {
			status?: DocumentVerificationStatus;
			type?: DocumentType;
		}
	) {
		return withPermission(
			async (session) =>
				this.repo.findAllForReview(page, search, filters, session?.user?.id),
			DOCUMENT_REVIEW_READ_AUTH
		);
	}

	async findByIdWithRelations(id: string) {
		return withPermission(
			async () => this.repo.findByIdWithRelations(id),
			DOCUMENT_REVIEW_READ_AUTH
		);
	}

	async countPending() {
		return withPermission(
			async () => this.repo.countPending(),
			DOCUMENT_REVIEW_READ_AUTH
		);
	}

	async updateRotation(id: string, rotation: number) {
		return withPermission(
			async () => this.repo.updateRotation(id, rotation),
			DOCUMENT_REVIEW_UPDATE_AUTH
		);
	}

	async updateVerificationStatus(
		id: string,
		status: DocumentVerificationStatus,
		rejectionReason?: string
	) {
		return withPermission(
			async (session) =>
				this.repo.updateVerificationStatus(
					id,
					status,
					rejectionReason,
					this.buildAuditOptions(session, 'update')
				),
			DOCUMENT_REVIEW_UPDATE_AUTH
		);
	}

	async updateApplicantField(
		applicantId: string,
		field: string,
		value: string | null
	) {
		return withPermission(
			async (session) =>
				this.repo.updateApplicantField(
					applicantId,
					field,
					value,
					this.buildAuditOptions(session, 'update')
				),
			DOCUMENT_REVIEW_UPDATE_AUTH
		);
	}

	async updateAcademicRecordField(
		recordId: string,
		field: string,
		value: string | number | null
	) {
		return withPermission(
			async () => this.repo.updateAcademicRecordField(recordId, field, value),
			DOCUMENT_REVIEW_UPDATE_AUTH
		);
	}

	async updateSubjectGradeField(
		gradeId: string,
		field: 'originalGrade' | 'standardGrade',
		value: string | null
	) {
		return withPermission(
			async () => this.repo.updateSubjectGradeField(gradeId, field, value),
			DOCUMENT_REVIEW_UPDATE_AUTH
		);
	}

	async acquireLock(documentId: string) {
		return withPermission(async (session) => {
			const userId = session?.user?.id;
			if (!userId) return null;
			return this.repo.acquireLock(documentId, userId);
		}, DOCUMENT_REVIEW_UPDATE_AUTH);
	}

	async releaseLock(documentId: string) {
		return withPermission(async (session) => {
			const userId = session?.user?.id;
			if (!userId) return null;
			return this.repo.releaseLock(documentId, userId);
		}, DOCUMENT_REVIEW_UPDATE_AUTH);
	}

	async releaseAllLocks() {
		return withPermission(async (session) => {
			const userId = session?.user?.id;
			if (!userId) return;
			return this.repo.releaseAllLocks(userId);
		}, DOCUMENT_REVIEW_UPDATE_AUTH);
	}

	async findNextUnlocked(
		currentId: string,
		filters?: {
			status?: DocumentVerificationStatus;
			type?: DocumentType;
		}
	) {
		return withPermission(async (session) => {
			const userId = session?.user?.id;
			if (!userId) return null;
			return this.repo.findNextUnlocked(currentId, userId, filters);
		}, DOCUMENT_REVIEW_READ_AUTH);
	}
}

export const documentReviewService = serviceWrapper(
	DocumentReviewService,
	'DocumentReviewService'
);
