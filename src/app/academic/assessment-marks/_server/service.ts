import type { assessmentMarks } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import AssessmentMarkRepository from './repository';

type AssessmentMark = typeof assessmentMarks.$inferInsert;

class AssessmentMarkService {
	constructor(private readonly repository = new AssessmentMarkRepository()) {}

	async create(data: AssessmentMark) {
		return withAuth(async () => this.repository.create(data), ['academic']);
	}

	async update(id: number, data: AssessmentMark) {
		return withAuth(async () => this.repository.update(id, data), ['academic']);
	}

	async getByModuleId(moduleId: number, termId: number) {
		return withAuth(
			async () => this.repository.findByModuleId(moduleId, termId),
			['academic']
		);
	}

	async getByStudentModuleId(studentModuleId: number) {
		return withAuth(
			async () => this.repository.findByStudentModuleId(studentModuleId),
			['academic']
		);
	}

	async getByStudentModuleIdWithDetails(studentModuleId: number) {
		return withAuth(
			async () =>
				this.repository.findByStudentModuleIdWithDetails(studentModuleId),
			['academic', 'registry', 'admin']
		);
	}

	async getStudentMarks(smId: number) {
		return withAuth(
			async () => this.repository.getStudentMarks(smId),
			['academic', 'registry', 'admin']
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

	async getStudentAuditHistory(studentModuleId: number) {
		return withAuth(
			async () => this.repository.getStudentAuditHistory(studentModuleId),
			['academic']
		);
	}
}

export const assessmentMarksService = serviceWrapper(
	AssessmentMarkService,
	'AssessmentMarkService'
);
