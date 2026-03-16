'use server';

import { getActiveTerm } from '@/app/registry/terms';
import type { assessments, lmsAssessments } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { assessmentsService as service } from './service';

type Assessment = typeof assessments.$inferInsert;

export const getAssessment = createAction(async (id: number) =>
	service.get(id)
);

export const getAssessmentByModuleId = createAction(
	async (moduleId: number) => {
		const term = await getActiveTerm();
		return service.getByModuleId(moduleId, term.id);
	}
);

export const getAssessmentByLmsId = createAction(async (lmsId: number) =>
	service.getByLmsId(lmsId)
);

export const createAssessment = createAction(
	async (
		assessment: Assessment,
		lmsData?: Omit<typeof lmsAssessments.$inferInsert, 'assessmentId'>
	) => {
		const term = await getActiveTerm();
		return service.create({ ...assessment, termId: term.id }, lmsData);
	}
);

export const updateAssessment = createAction(
	async (
		id: number,
		assessment: Assessment,
		lmsData?: Partial<Omit<typeof lmsAssessments.$inferInsert, 'assessmentId'>>
	) => service.updateWithGradeRecalculation(id, assessment, lmsData)
);

export const deleteAssessment = createAction(async (id: number) =>
	service.delete(id)
);

export const getAssessmentAuditHistory = createAction(
	async (assessmentId: number) => service.getAuditHistory(assessmentId)
);
