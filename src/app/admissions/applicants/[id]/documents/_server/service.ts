import type {
	applicantDocuments,
	DocumentType,
	DocumentVerificationStatus,
	documents,
} from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
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
			byIdRoles: ['registry', 'admin'],
			findAllRoles: ['registry', 'admin'],
			createRoles: ['registry', 'admin'],
			updateRoles: ['registry', 'admin'],
			deleteRoles: ['registry', 'admin'],
		});
		this.repo = repo;
	}

	async findByApplicant(applicantId: string, page = 1) {
		return withAuth(
			async () => this.repo.findByApplicant(applicantId, page),
			['registry', 'admin']
		);
	}

	async findByType(applicantId: string, type: DocumentType) {
		return withAuth(
			async () => this.repo.findByType(applicantId, type),
			['registry', 'admin']
		);
	}

	async uploadDocument(
		documentData: typeof documents.$inferInsert,
		applicantId: string,
		fileSize: number
	) {
		return withAuth(async () => {
			if (fileSize > MAX_FILE_SIZE) {
				throw new Error('FILE_TOO_LARGE: Document exceeds 5MB limit');
			}
			return this.repo.createWithDocument(documentData, applicantId);
		}, ['registry', 'admin']);
	}

	async verifyDocument(
		id: string,
		status: DocumentVerificationStatus,
		rejectionReason?: string
	) {
		return withAuth(async () => {
			if (status === 'rejected' && !rejectionReason) {
				throw new Error('Rejection reason is required');
			}
			return this.repo.updateVerificationStatus(id, status, rejectionReason);
		}, ['registry', 'admin']);
	}

	override async delete(id: string) {
		return withAuth(
			async () => this.repo.removeById(id),
			['registry', 'admin']
		);
	}
}

export const applicantDocumentsService = serviceWrapper(
	ApplicantDocumentService,
	'ApplicantDocumentService'
);
