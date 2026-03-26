import { hasSessionPermission } from '@/core/auth/sessionPermissions';
import type {
	applicantDocuments,
	DocumentType,
	DocumentVerificationStatus,
	documents,
} from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import { UserFacingError } from '@/shared/lib/actions/extractError';
import ApplicantDocumentRepository from './repository';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

class ApplicantDocumentService extends BaseService<
	typeof applicantDocuments,
	'id'
> {
	private repo: ApplicantDocumentRepository;

	constructor() {
		const repo = new ApplicantDocumentRepository();
		super(repo, {
			byIdAuth: { 'admissions-documents': ['read'] },
			findAllAuth: { 'admissions-documents': ['read'] },
			createAuth: { 'admissions-documents': ['create'] },
			updateAuth: { 'admissions-documents': ['update'] },
			deleteAuth: { 'admissions-documents': ['delete'] },
			activityTypes: {
				create: 'applicant_document_uploaded',
				update: 'applicant_document_reviewed',
				delete: 'applicant_document_deleted',
			},
		});
		this.repo = repo;
	}

	async findByApplicant(applicantId: string, page = 1) {
		return withPermission(
			async () => this.repo.findByApplicant(applicantId, page),
			async (session) =>
				hasSessionPermission(session, 'admissions-documents', 'read', [
					'applicant',
					'user',
				])
		);
	}

	async findByType(applicantId: string, type: DocumentType) {
		return withPermission(
			async () => this.repo.findByType(applicantId, type),
			async (session) =>
				hasSessionPermission(session, 'admissions-documents', 'read', [
					'applicant',
					'user',
				])
		);
	}

	async uploadDocument(
		documentData: typeof documents.$inferInsert,
		applicantId: string,
		fileSize: number
	) {
		return withPermission(
			async (session) => {
				if (fileSize > MAX_FILE_SIZE) {
					throw new UserFacingError('Document exceeds 5MB limit');
				}
				return this.repo.createWithDocument(
					documentData,
					applicantId,
					this.buildAuditOptions(session, 'create')
				);
			},
			async (session) =>
				hasSessionPermission(session, 'admissions-documents', 'create', [
					'applicant',
					'user',
				])
		);
	}

	async verifyDocument(
		id: string,
		status: DocumentVerificationStatus,
		rejectionReason?: string
	) {
		return withPermission(
			async (session) => {
				if (status === 'rejected' && !rejectionReason) {
					throw new UserFacingError('Rejection reason is required');
				}
				return this.repo.updateVerificationStatus(
					id,
					status,
					rejectionReason,
					this.buildAuditOptions(session, 'update')
				);
			},
			async (session) =>
				hasSessionPermission(session, 'admissions-documents', 'update', [
					'applicant',
					'user',
				])
		);
	}

	override async delete(id: string) {
		return withPermission(
			async (session) =>
				this.repo.removeById(id, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'applicant_document_deleted',
				}),
			async (session) =>
				hasSessionPermission(session, 'admissions-documents', 'delete', [
					'applicant',
					'user',
				])
		);
	}
}

export const applicantDocumentsService = serviceWrapper(
	ApplicantDocumentService,
	'ApplicantDocumentService'
);
