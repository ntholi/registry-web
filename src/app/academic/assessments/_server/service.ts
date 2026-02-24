import { getRecordHistory } from '@/app/audit-logs/_server/actions';
import type { assessments, lmsAssessments } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import AssessmentRepository from './repository';

class AssessmentService extends BaseService<typeof assessments, 'id'> {
	constructor() {
		super(new AssessmentRepository(), {
			byIdRoles: ['academic', 'leap'],
			findAllRoles: ['academic', 'leap'],
			createRoles: ['academic', 'leap'],
			updateRoles: ['academic', 'leap'],
			deleteRoles: ['academic', 'leap'],
			countRoles: ['academic', 'leap'],
			activityTypes: {
				create: 'assessment_created',
				update: 'assessment_updated',
				delete: 'assessment_deleted',
			},
		});
	}

	override async create(
		data: typeof assessments.$inferInsert,
		lmsData?: Omit<typeof lmsAssessments.$inferInsert, 'assessmentId'>
	) {
		return withAuth(
			async (session) =>
				(this.repository as AssessmentRepository).createWithLms(data, lmsData, {
					userId: session!.user!.id!,
					activityType: 'assessment_created',
				}),
			['academic', 'leap']
		);
	}

	async getByModuleId(moduleId: number, termId: number) {
		return withAuth(
			async () =>
				(this.repository as AssessmentRepository).getByModuleId(
					moduleId,
					termId
				),
			['academic', 'leap']
		);
	}

	async getByLmsId(lmsId: number) {
		return withAuth(
			async () => (this.repository as AssessmentRepository).findByLmsId(lmsId),
			['academic', 'leap']
		);
	}

	async getAuditHistory(assessmentId: number) {
		return withAuth(
			async () => getRecordHistory('assessments', String(assessmentId)),
			['academic', 'leap']
		);
	}

	async updateWithGradeRecalculation(
		id: number,
		data: Partial<typeof assessments.$inferInsert>,
		lmsData?: Partial<Omit<typeof lmsAssessments.$inferInsert, 'assessmentId'>>
	) {
		return withAuth(
			async (session) =>
				(this.repository as AssessmentRepository).updateWithGradeRecalculation(
					id,
					data,
					lmsData,
					{ userId: session!.user!.id!, activityType: 'assessment_updated' }
				),
			['academic', 'leap']
		);
	}
}

export const assessmentsService = serviceWrapper(
	AssessmentService,
	'AssessmentsService'
);
