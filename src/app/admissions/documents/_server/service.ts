import type {
	applicantDocuments,
	DocumentType,
	DocumentVerificationStatus,
} from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import DocumentReviewRepository from './repository';

const ROLES = ['registry', 'marketing', 'admin'] as const;

class DocumentReviewService extends BaseService<
	typeof applicantDocuments,
	'id'
> {
	private repo: DocumentReviewRepository;

	constructor() {
		const repo = new DocumentReviewRepository();
		super(repo, {
			byIdRoles: [...ROLES],
			findAllRoles: [...ROLES],
			updateRoles: [...ROLES],
			deleteRoles: [...ROLES],
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
		return withAuth(
			async (session) =>
				this.repo.findAllForReview(page, search, filters, session?.user?.id),
			[...ROLES]
		);
	}

	async findByIdWithRelations(id: string) {
		return withAuth(
			async () => this.repo.findByIdWithRelations(id),
			[...ROLES]
		);
	}

	async updateRotation(id: string, rotation: number) {
		return withAuth(
			async () => this.repo.updateRotation(id, rotation),
			[...ROLES]
		);
	}

	async updateVerificationStatus(
		id: string,
		status: DocumentVerificationStatus,
		rejectionReason?: string
	) {
		return withAuth(
			async () =>
				this.repo.updateVerificationStatus(id, status, rejectionReason),
			[...ROLES]
		);
	}

	async updateApplicantField(
		applicantId: string,
		field: string,
		value: string | null
	) {
		return withAuth(
			async () => this.repo.updateApplicantField(applicantId, field, value),
			[...ROLES]
		);
	}

	async updateAcademicRecordField(
		recordId: string,
		field: string,
		value: string | number | null
	) {
		return withAuth(
			async () => this.repo.updateAcademicRecordField(recordId, field, value),
			[...ROLES]
		);
	}

	async updateSubjectGradeField(
		gradeId: string,
		field: 'originalGrade' | 'standardGrade',
		value: string | null
	) {
		return withAuth(
			async () => this.repo.updateSubjectGradeField(gradeId, field, value),
			[...ROLES]
		);
	}

	async acquireLock(documentId: string) {
		return withAuth(
			async (session) => {
				const userId = session?.user?.id;
				if (!userId) return null;
				return this.repo.acquireLock(documentId, userId);
			},
			[...ROLES]
		);
	}

	async releaseLock(documentId: string) {
		return withAuth(
			async (session) => {
				const userId = session?.user?.id;
				if (!userId) return null;
				return this.repo.releaseLock(documentId, userId);
			},
			[...ROLES]
		);
	}

	async releaseAllLocks() {
		return withAuth(
			async (session) => {
				const userId = session?.user?.id;
				if (!userId) return;
				return this.repo.releaseAllLocks(userId);
			},
			[...ROLES]
		);
	}

	async findNextUnlocked(
		currentId: string,
		filters?: {
			status?: DocumentVerificationStatus;
			type?: DocumentType;
		}
	) {
		return withAuth(
			async (session) => {
				const userId = session?.user?.id;
				if (!userId) return null;
				return this.repo.findNextUnlocked(currentId, userId, filters);
			},
			[...ROLES]
		);
	}
}

export const documentReviewService = serviceWrapper(
	DocumentReviewService,
	'DocumentReviewService'
);
