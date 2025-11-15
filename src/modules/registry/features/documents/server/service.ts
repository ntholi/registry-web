import type { documents } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import DocumentRepository from './repository';

type Document = typeof documents.$inferInsert;

class DocumentService {
	constructor(private readonly repository = new DocumentRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

	async get(id: string) {
		return withAuth(
			async () => this.repository.findById(id),
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

	async getAll(params: QueryOptions<typeof documents>) {
		return withAuth(
			async () => this.repository.query(params),
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

	async create(data: Document) {
		return withAuth(
			async () => this.repository.create(data),
			['admin', 'registry', 'student_services']
		);
	}

	async update(id: string, data: Partial<Document>) {
		return withAuth(
			async () => this.repository.update(id, data),
			['admin', 'registry', 'student_services']
		);
	}

	async delete(id: string) {
		return withAuth(
			async () => this.repository.delete(id),
			['admin', 'registry', 'student_services']
		);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}
}

export const documentsService = serviceWrapper(DocumentService, 'Document');
