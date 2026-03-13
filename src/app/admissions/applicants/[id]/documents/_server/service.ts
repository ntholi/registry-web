import { hasApplicantResourceAccess } from '@/core/auth/sessionPermissions';
import type {
	applicantDocuments,
	DocumentType,
	DocumentVerificationStatus,
	documents,
} from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import ApplicantDocumentRepository from './repository';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function canAccessApplicantDocuments(
	session: Parameters<typeof hasApplicantResourceAccess>[0],
	action: 'read' | 'create' | 'update' | 'delete'
) {
	return hasApplicantResourceAccess(session, 'admissions-documents', action);
}

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
			async (session) => canAccessApplicantDocuments(session, 'read')
		);
	}

	async findByType(applicantId: string, type: DocumentType) {
		return withPermission(
			async () => this.repo.findByType(applicantId, type),
			async (session) => canAccessApplicantDocuments(session, 'read')
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
					throw new Error('FILE_TOO_LARGE: Document exceeds 5MB limit');
				}
				return this.repo.createWithDocument(
					documentData,
					applicantId,
					this.buildAuditOptions(session, 'create')
				);
			},
			async (session) => canAccessApplicantDocuments(session, 'create')
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
					throw new Error('Rejection reason is required');
				}
				return this.repo.updateVerificationStatus(
					id,
					status,
					rejectionReason,
					this.buildAuditOptions(session, 'update')
				);
			},
			async (session) => canAccessApplicantDocuments(session, 'update')
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
			async (session) => canAccessApplicantDocuments(session, 'delete')
		);
	}
}

export const applicantDocumentsService = serviceWrapper(
	ApplicantDocumentService,
	'ApplicantDocumentService'
);
