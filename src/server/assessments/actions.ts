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
  
  const results = await Promise.all(
    semesterModuleIds.map(id => service.getBySemesterModuleId(id))
  );
  
  // Flatten and deduplicate assessments by ID
  const assessmentMap = new Map();
  results.flat().forEach(assessment => {
    if (assessment && !assessmentMap.has(assessment.id)) {
      assessmentMap.set(assessment.id, assessment);
    }
  });
  
  return Array.from(assessmentMap.values());
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
