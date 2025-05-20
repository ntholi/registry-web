'use server';

import { assessments } from '@/db/schema';
import { assessmentsService as service } from './service';
import { getCurrentTerm } from '../terms/actions';

type Assessment = typeof assessments.$inferInsert;

export async function getAssessment(id: number) {
  return service.get(id);
}

export async function getAssessments(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function getAssessmentBySemesterModuleId(
  semesterModuleId: number,
) {
  return service.getBySemesterModuleId(semesterModuleId);
}

export async function getAssessmentsByMultipleSemesterModuleIds(
  semesterModuleIds: number[],
) {
  if (!semesterModuleIds.length) return [];
  return service.getBySemesterModuleIds(semesterModuleIds);
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
