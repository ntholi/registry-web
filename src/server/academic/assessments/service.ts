import type { QueryOptions } from '@server/base/BaseRepository';
import type { assessments } from '@/db/schema';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import withAuth from '@/server/base/withAuth';
import AssessmentRepository from './repository';

type Assessment = typeof assessments.$inferInsert;

class AssessmentService {
	constructor(private readonly repository = new AssessmentRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

	async get(id: number) {
		return withAuth(async () => this.repository.findById(id), ['academic']);
	}

	async getAll(params: QueryOptions<typeof assessments>) {
		return withAuth(async () => this.repository.query(params), ['academic']);
	}

	async getByModuleId(moduleId: number) {
		return withAuth(
			async () => this.repository.getByModuleId(moduleId),
			['academic']
		);
	}

	async create(data: Assessment) {
		return withAuth(async () => this.repository.create(data), ['academic']);
	}

	async update(id: number, data: Assessment) {
		return withAuth(async () => this.repository.update(id, data), ['academic']);
	}
	async delete(id: number) {
		return withAuth(async () => this.repository.delete(id), ['academic']);
	}

	async count() {
		return withAuth(async () => this.repository.count(), ['academic']);
	}

	async getAuditHistory(assessmentId: number) {
		return withAuth(
			async () => this.repository.getAuditHistory(assessmentId),
			['academic']
		);
	}
}

export const assessmentsService = serviceWrapper(
	AssessmentService,
	'AssessmentsService'
);
