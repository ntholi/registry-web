'use server';

import { assessmentMarks } from '@/db/schema';
import { calculateModuleGrade } from '@/utils/gradeCalculations';
import { upsertModuleGrade } from '../module-grades/actions';
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

export async function getAssessmentMarksAuditHistory(assessmentMarkId: number) {
  return service.getAuditHistory(assessmentMarkId);
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

export async function calculateAndSaveModuleGrade(
  moduleId: number,
  stdNo: number,
) {
  const assessments = await service.getAssessmentsByModuleId(moduleId);
  const assessmentMarks = await service.getByModuleAndStudent(moduleId, stdNo);

  if (!assessments || assessments.length === 0) {
    return null;
  }

  const gradeCalculation = calculateModuleGrade(
    assessments.map((a) => ({
      id: a.id,
      weight: a.weight,
      totalMarks: a.totalMarks,
    })),
    assessmentMarks.map((m) => ({
      assessment_id: m.assessmentId,
      marks: m.marks,
    })),
  );
  if (gradeCalculation.hasMarks) {
    await upsertModuleGrade({
      moduleId,
      stdNo,
      grade: gradeCalculation.grade,
      weightedTotal: gradeCalculation.weightedTotal,
    });
  }

  return gradeCalculation;
}
