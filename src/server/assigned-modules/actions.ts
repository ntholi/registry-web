'use server';

import { assignedModules } from '@/db/schema';
import { assignedModulesService as service } from './service';

type AssignedModule = typeof assignedModules.$inferInsert;

export async function getAssignedModule(id: number) {
  return service.get(id);
}

export async function getAssignedModules(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function createAssignedModule(assignedModule: AssignedModule) {
  return service.create(assignedModule);
}

export async function updateAssignedModule(
  id: number,
  assignedModule: AssignedModule,
) {
  return service.update(id, assignedModule);
}

export async function deleteAssignedModule(id: number) {
  return service.delete(id);
}

export async function assignModulesToLecturer(
  userId: string,
  semesterModuleIds: number[],
) {
  return service.assignModulesToLecturer(userId, semesterModuleIds);
}
