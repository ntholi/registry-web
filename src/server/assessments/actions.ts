'use server';


import { assessments } from '@/db/schema';
import { assessmentsService as service} from './service';

type Assessment = typeof assessments.$inferInsert;


export async function getAssessment(id: number) {
  return service.get(id);
}

export async function getAssessments(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function createAssessment(assessment: Assessment) {
  return service.create(assessment);
}

export async function updateAssessment(id: number, assessment: Assessment) {
  return service.update(id, assessment);
}

export async function deleteAssessment(id: number) {
  return service.delete(id);
}