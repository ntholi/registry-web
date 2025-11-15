import type { assessments } from '@/core/database';
import BaseService from '@/core/platform/BaseService';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import AssessmentRepository from './repository';

class AssessmentService extends BaseService<typeof assessments, 'id'> {
	constructor() {
		super(new AssessmentRepository(), {
			byIdRoles: ['academic'],
			findAllRoles: ['academic'],
			createRoles: ['academic'],
			updateRoles: ['academic'],
			deleteRoles: ['academic'],
			countRoles: ['academic'],
		});
	}

	async getByModuleId(moduleId: number) {
		return withAuth(
			async () =>
				(this.repository as AssessmentRepository).getByModuleId(moduleId),
			['academic']
		);
	}

	async getAuditHistory(assessmentId: number) {
		return withAuth(
			async () =>
				(this.repository as AssessmentRepository).getAuditHistory(assessmentId),
			['academic']
		);
	}
}

export const assessmentsService = serviceWrapper(
	AssessmentService,
	'AssessmentsService'
);
