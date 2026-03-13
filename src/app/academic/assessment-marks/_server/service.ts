import {
	getRecordHistory,
	getStudentModuleAuditHistory,
} from '@/app/audit-logs/_server/actions';
import { hasPermission } from '@/core/auth/sessionPermissions';
import type { assessmentMarks } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import AssessmentMarkRepository from './repository';

type AssessmentMark = typeof assessmentMarks.$inferInsert;

class AssessmentMarkService {
	constructor(private readonly repository = new AssessmentMarkRepository()) {}

	async create(data: AssessmentMark, stdNo?: number) {
		return withPermission(
			async (session) =>
				this.repository.create(data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'mark_entered',
					stdNo,
				}),
			{ gradebook: ['update'] }
		);
	}

	async update(id: number, data: AssessmentMark, stdNo?: number) {
		return withPermission(
			async (session) =>
				this.repository.update(id, data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'mark_updated',
					stdNo,
				}),
			{ gradebook: ['update'] }
		);
	}

	async getByModuleId(moduleId: number, termId: number) {
		return withPermission(
			async () => this.repository.findByModuleId(moduleId, termId),
			{ gradebook: ['read'] }
		);
	}

	async getByStudentModuleId(studentModuleId: number) {
		return withPermission(
			async () => this.repository.findByStudentModuleId(studentModuleId),
			{ gradebook: ['read'] }
		);
	}

	async getByStudentModuleIdWithDetails(studentModuleId: number) {
		return withPermission(
			async () =>
				this.repository.findByStudentModuleIdWithDetails(studentModuleId),
			async (session) =>
				hasPermission(session, 'gradebook', 'read') ||
				session?.user?.role === 'registry'
		);
	}

	async getStudentMarks(smId: number) {
		return withPermission(
			async () => this.repository.getStudentMarks(smId),
			async (session) =>
				hasPermission(session, 'gradebook', 'read') ||
				session?.user?.role === 'registry'
		);
	}

	async getAssessmentsByModuleId(moduleId: number, termId: number) {
		return withPermission(
			async () => this.repository.getAssessmentsByModuleId(moduleId, termId),
			{ gradebook: ['read'] }
		);
	}

	async getAuditHistory(assessmentMarkId: number) {
		return withPermission(
			async () =>
				getRecordHistory('assessment_marks', String(assessmentMarkId)),
			{ gradebook: ['read'] }
		);
	}

	async createOrUpdateMarks(data: AssessmentMark, stdNo?: number) {
		return withPermission(
			async (session) =>
				this.repository.createOrUpdateMarks(data, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'mark_entered',
					stdNo,
				}),
			{ gradebook: ['update'] }
		);
	}

	async createOrUpdateMarksInBulk(dataArray: AssessmentMark[]) {
		return withPermission(
			async (session) =>
				this.repository.createOrUpdateMarksInBulk(dataArray, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'mark_entered',
				}),
			{ gradebook: ['update'] }
		);
	}

	async getStudentAuditHistory(studentModuleId: number) {
		return withPermission(
			async () => getStudentModuleAuditHistory(studentModuleId),
			{ gradebook: ['read'] }
		);
	}
}

export const assessmentMarksService = serviceWrapper(
	AssessmentMarkService,
	'AssessmentMarkService'
);
