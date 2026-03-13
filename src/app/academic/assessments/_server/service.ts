import { getRecordHistory } from '@/app/audit-logs/_server/actions';
import type { assessments, lmsAssessments } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';
import AssessmentRepository from './repository';

class AssessmentService extends BaseService<typeof assessments, 'id'> {
	constructor() {
		super(new AssessmentRepository(), {
			byIdAuth: { assessments: ['read'] },
			findAllAuth: { assessments: ['read'] },
			createAuth: { assessments: ['create'] },
			updateAuth: { assessments: ['update'] },
			deleteAuth: { assessments: ['delete'] },
			countAuth: { assessments: ['read'] },
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
		return withPermission(
			async (session) =>
				(this.repository as AssessmentRepository).createWithLms(data, lmsData, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'assessment_created',
				}),
			{ assessments: ['create'] }
		);
	}

	async getByModuleId(moduleId: number, termId: number) {
		return withPermission(
			async () =>
				(this.repository as AssessmentRepository).getByModuleId(
					moduleId,
					termId
				),
			{ assessments: ['read'] }
		);
	}

	async getByLmsId(lmsId: number) {
		return withPermission(
			async () => (this.repository as AssessmentRepository).findByLmsId(lmsId),
			{ assessments: ['read'] }
		);
	}

	async getAuditHistory(assessmentId: number) {
		return withPermission(
			async () => getRecordHistory('assessments', String(assessmentId)),
			{ assessments: ['read'] }
		);
	}

	async updateWithGradeRecalculation(
		id: number,
		data: Partial<typeof assessments.$inferInsert>,
		lmsData?: Partial<Omit<typeof lmsAssessments.$inferInsert, 'assessmentId'>>
	) {
		return withPermission(
			async (session) =>
				(this.repository as AssessmentRepository).updateWithGradeRecalculation(
					id,
					data,
					lmsData,
					{
						userId: session!.user!.id!,
						role: session!.user!.role!,
						activityType: 'assessment_updated',
					}
				),
			{ assessments: ['update'] }
		);
	}
}

export const assessmentsService = serviceWrapper(
	AssessmentService,
	'AssessmentsService'
);
