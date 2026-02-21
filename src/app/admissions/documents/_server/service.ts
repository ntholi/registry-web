import type {
	applicantDocuments,
	DocumentType,
	DocumentVerificationStatus,
} from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import DocumentReviewRepository from './repository';

class DocumentReviewService extends BaseService<
	typeof applicantDocuments,
	'id'
> {
	private repo: DocumentReviewRepository;

	constructor() {
		const repo = new DocumentReviewRepository();
		super(repo, {
			byIdRoles: ['registry', 'marketing', 'admin'],
			findAllRoles: ['registry', 'marketing', 'admin'],
			updateRoles: ['registry', 'marketing', 'admin'],
			deleteRoles: ['registry', 'marketing', 'admin'],
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
			async () => this.repo.findAllForReview(page, search, filters),
			['registry', 'marketing', 'admin']
		);
	}

	async findByIdWithRelations(id: string) {
		return withAuth(
			async () => this.repo.findByIdWithRelations(id),
			['registry', 'marketing', 'admin']
		);
	}

	async updateRotation(id: string, rotation: number) {
		return withAuth(
			async () => this.repo.updateRotation(id, rotation),
			['registry', 'marketing', 'admin']
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
			['registry', 'marketing', 'admin']
		);
	}

	async updateApplicantField(
		applicantId: string,
		field: string,
		value: string | null
	) {
		return withAuth(
			async () => this.repo.updateApplicantField(applicantId, field, value),
			['registry', 'marketing', 'admin']
		);
	}

	async updateAcademicRecordField(
		recordId: string,
		field: string,
		value: string | number | null
	) {
		return withAuth(
			async () => this.repo.updateAcademicRecordField(recordId, field, value),
			['registry', 'marketing', 'admin']
		);
	}

	async updateSubjectGradeField(
		gradeId: string,
		field: 'originalGrade' | 'standardGrade',
		value: string | null
	) {
		return withAuth(
			async () => this.repo.updateSubjectGradeField(gradeId, field, value),
			['registry', 'marketing', 'admin']
		);
	}
}

export const documentReviewService = serviceWrapper(
	DocumentReviewService,
	'DocumentReviewService'
);
