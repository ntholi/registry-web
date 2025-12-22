'use server';

import { getCurrentTerm } from '@registry/dates/terms';
import type { assessments, lmsAssessments } from '@/core/database';
import { assessmentsService as service } from './service';

type Assessment = typeof assessments.$inferInsert;

export async function getAssessment(id: number) {
	return service.get(id);
}

export async function getAssessments(page: number = 1, search = '') {
	return service.findAll({
		page,
		search,
		searchColumns: ['assessmentNumber', 'assessmentType'],
		sort: [{ column: 'assessmentNumber', order: 'asc' }],
	});
}

export async function getAssessmentByModuleId(moduleId: number) {
	const term = await getCurrentTerm();
	return service.getByModuleId(moduleId, term.id);
}

export async function getAssessmentByLmsId(lmsId: number) {
	return service.getByLmsId(lmsId);
}

export async function createAssessment(
	assessment: Assessment,
	lmsData?: Omit<typeof lmsAssessments.$inferInsert, 'assessmentId'>
) {
	const term = await getCurrentTerm();
	return service.create({ ...assessment, termId: term.id }, lmsData);
}

export async function updateAssessment(
	id: number,
	assessment: Assessment,
	lmsData?: Partial<Omit<typeof lmsAssessments.$inferInsert, 'assessmentId'>>
) {
	return service.update(id, assessment, lmsData);
}

export async function deleteAssessment(id: number) {
	return service.delete(id);
}

export async function getAssessmentAuditHistory(assessmentId: number) {
	return service.getAuditHistory(assessmentId);
}
