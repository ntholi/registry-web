import { serviceWrapper } from '@/core/platform/serviceWrapper';
import {
	requireSessionUserId,
	withPermission,
} from '@/core/platform/withPermission';
import type { DocumentType } from '../_schema/documents';
import DocumentRepository from './repository';

class DocumentService {
	constructor(private readonly repository = new DocumentRepository()) {}

	async get(id: string) {
		return withPermission(
			async () => this.repository.findByIdWithDocument(id),
			{ documents: ['read'] }
		);
	}

	async getByStudent(stdNo: number) {
		return withPermission(async () => this.repository.findByStudent(stdNo), {
			documents: ['read'],
		});
	}

	async create(data: {
		fileName: string;
		fileUrl: string;
		type: DocumentType;
		stdNo: number;
	}) {
		return withPermission(
			async (session) =>
				this.repository.createWithDocument(data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'document_uploaded',
					stdNo: data.stdNo,
				}),
			{ documents: ['create'] }
		);
	}

	async delete(id: string) {
		return withPermission(
			async (session) =>
				this.repository.removeById(id, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'document_deleted',
				}),
			{ documents: ['create'] }
		);
	}
}

export const documentsService = serviceWrapper(DocumentService, 'Document');
