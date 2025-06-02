'use server';

import { assessmentMarks, gradeEnum } from '@/db/schema';
import { assessmentMarksService as service } from './service';

type AssessmentMark = typeof assessmentMarks.$inferInsert;

export async function getAssessmentMark(id: number) {
  return service.get(id);
}

export async function getAssessmentMarks(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function getAssessmentMarksByModuleId(moduleId: number) {
  return service.getByModuleId(moduleId);
}

export async function createAssessmentMark(assessmentMark: AssessmentMark) {
  return service.create(assessmentMark);
}

export async function updateAssessmentMark(
  id: number,
  assessmentMark: AssessmentMark,
) {
  return service.update(id, assessmentMark);
}

export async function deleteAssessmentMark(id: number) {
  return service.delete(id);
}

export async function getAssessmentGradeByAssessmentAndStudent(
  assessmentId: number,
  stdNo: number
) {
  return service.getGradeByAssessmentAndStudent(assessmentId, stdNo);
}

export async function saveAssessmentGrade(
  assessmentId: number,
  stdNo: number,
  grade: typeof gradeEnum[number]
) {
  return service.saveGrade(assessmentId, stdNo, grade);
}

export async function getAssessmentGradesByModuleId(moduleId: number) {
  return service.getGradesByModuleId(moduleId);
}
