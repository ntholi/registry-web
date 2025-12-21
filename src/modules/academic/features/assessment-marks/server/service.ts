import type { assessmentMarks } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import AssessmentMarkRepository from './repository';

type AssessmentMark = typeof assessmentMarks.$inferInsert;

class AssessmentMarkService {
	constructor(private readonly repository = new AssessmentMarkRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

	async get(id: number) {
		return withAuth(async () => this.repository.findById(id), ['academic']);
	}

	async getAll(params: QueryOptions<typeof assessmentMarks>) {
		return withAuth(async () => this.repository.query(params), ['academic']);
	}

	async create(data: AssessmentMark) {
		return withAuth(async () => this.repository.create(data), ['academic']);
	}

	async update(id: number, data: AssessmentMark) {
		return withAuth(async () => this.repository.update(id, data), ['academic']);
	}

	async delete(id: number) {
		return withAuth(async () => this.repository.delete(id), ['academic']);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}

	async getByModuleId(moduleId: number, termId: number) {
		return withAuth(
			async () => this.repository.findByModuleId(moduleId, termId),
			['academic']
		);
	}

	async getByModuleAndStudent(moduleId: number, stdNo: number, termId: number) {
		return withAuth(
			async () =>
				this.repository.findByModuleAndStudent(moduleId, stdNo, termId),
			['academic']
		);
	}

	async getAssessmentsByModuleId(moduleId: number, termId: number) {
		return withAuth(
			async () => this.repository.getAssessmentsByModuleId(moduleId, termId),
			['academic']
		);
	}

	async getAuditHistory(assessmentMarkId: number) {
		return withAuth(
			async () => this.repository.getAuditHistory(assessmentMarkId),
			['academic']
		);
	}
	async createOrUpdateMarks(data: AssessmentMark) {
		return withAuth(
			async () => this.repository.createOrUpdateMarks(data),
			['academic']
		);
	}

	async createOrUpdateMarksInBulk(dataArray: AssessmentMark[]) {
		return withAuth(
			async () => this.repository.createOrUpdateMarksInBulk(dataArray),
			['academic']
		);
	}

	async getStudentAuditHistory(stdNo: number) {
		return withAuth(
			async () => this.repository.getStudentAuditHistory(stdNo),
			['academic']
		);
	}
}

export const assessmentMarksService = serviceWrapper(
	AssessmentMarkService,
	'AssessmentMarkService'
);
