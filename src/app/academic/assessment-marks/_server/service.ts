import {
	getRecordHistory,
	getStudentModuleAuditHistory,
} from '@/app/audit-logs/_server/actions';
import type { assessmentMarks } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import AssessmentMarkRepository from './repository';

type AssessmentMark = typeof assessmentMarks.$inferInsert;

class AssessmentMarkService {
	constructor(private readonly repository = new AssessmentMarkRepository()) {}

	async create(data: AssessmentMark, stdNo?: number) {
		return withAuth(
			async (session) =>
				this.repository.create(data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'mark_entered',
					stdNo,
				}),
			['academic']
		);
	}

	async update(id: number, data: AssessmentMark, stdNo?: number) {
		return withAuth(
			async (session) =>
				this.repository.update(id, data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'mark_updated',
					stdNo,
				}),
			['academic']
		);
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
			async () =>
				getRecordHistory('assessment_marks', String(assessmentMarkId)),
			['academic']
		);
	}

	async createOrUpdateMarks(data: AssessmentMark, stdNo?: number) {
		return withAuth(
			async (session) =>
				this.repository.createOrUpdateMarks(data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'mark_entered',
					stdNo,
				}),
			['academic']
		);
	}

	async createOrUpdateMarksInBulk(dataArray: AssessmentMark[]) {
		return withAuth(
			async (session) =>
				this.repository.createOrUpdateMarksInBulk(dataArray, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'mark_entered',
				}),
			['academic']
		);
	}

	async getStudentAuditHistory(studentModuleId: number) {
		return withAuth(
			async () => getStudentModuleAuditHistory(studentModuleId),
			['academic']
		);
	}
}

export const assessmentMarksService = serviceWrapper(
	AssessmentMarkService,
	'AssessmentMarkService'
);
