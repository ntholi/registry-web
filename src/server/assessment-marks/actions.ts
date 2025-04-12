'use server';


import { assessmentMarks } from '@/db/schema';
import { assessmentMarksService as service} from './service';

type AssessmentMark = typeof assessmentMarks.$inferInsert;


export async function getAssessmentMark(id: number) {
  return service.get(id);
}

export async function getAssessmentMarks(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function createAssessmentMark(assessmentMark: AssessmentMark) {
  return service.create(assessmentMark);
}

export async function updateAssessmentMark(id: number, assessmentMark: AssessmentMark) {
  return service.update(id, assessmentMark);
}

export async function deleteAssessmentMark(id: number) {
  return service.delete(id);
}