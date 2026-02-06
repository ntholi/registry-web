import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import type { DocumentType } from '../_schema/documents';
import DocumentRepository from './repository';

class DocumentService {
	constructor(private readonly repository = new DocumentRepository()) {}

	async getByStudent(stdNo: number) {
		return withAuth(
			async () => this.repository.findByStudent(stdNo),
			async (session) => {
				const allowedRoles = [
					'admin',
					'registry',
					'finance',
					'student_services',
				];
				const allowedPositions = ['manager'];

				return (
					allowedRoles.includes(session.user?.role || '') ||
					allowedPositions.includes(session.user?.position || '')
				);
			}
		);
	}

	async create(data: {
		fileName: string;
		fileUrl: string;
		type: DocumentType;
		stdNo: number;
	}) {
		return withAuth(
			async () => this.repository.createWithDocument(data),
			['admin', 'registry', 'student_services']
		);
	}

	async delete(id: string) {
		return withAuth(
			async () => this.repository.removeById(id),
			['admin', 'registry', 'student_services']
		);
	}
}

export const documentsService = serviceWrapper(DocumentService, 'Document');
