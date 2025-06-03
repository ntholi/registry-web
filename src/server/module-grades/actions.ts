'use server';

import { moduleGrades } from '@/db/schema';
import { moduleGradesService as service } from './service';

type ModuleGrade = typeof moduleGrades.$inferInsert;

export async function getModuleGrade(id: number) {
  return service.get(id);
}

export async function getModuleGrades(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function createModuleGrade(moduleGrade: ModuleGrade) {
  return service.create(moduleGrade);
}

export async function updateModuleGrade(id: number, moduleGrade: ModuleGrade) {
  return service.update(id, moduleGrade);
}

export async function deleteModuleGrade(id: number) {
  return service.delete(id);
}
