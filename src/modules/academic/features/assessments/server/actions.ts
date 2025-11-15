'use server';

import { getCurrentTerm } from '@registry/terms';
import type { assessments } from '@/core/database';
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
	});
}

export async function getAssessmentByModuleId(moduleId: number) {
	return service.getByModuleId(moduleId);
}

export async function createAssessment(assessment: Assessment) {
	const term = await getCurrentTerm();
	return service.create({ ...assessment, termId: term.id });
}

export async function updateAssessment(id: number, assessment: Assessment) {
	return service.update(id, assessment);
}

export async function deleteAssessment(id: number) {
	return service.delete(id);
}

export async function getAssessmentAuditHistory(assessmentId: number) {
	return service.getAuditHistory(assessmentId);
}
