'use server';

import { lecturerModules } from '@/db/schema';
import { lecturesModulesService as service } from './service';

type LecturesModule = typeof lecturerModules.$inferInsert;

export async function getLecturesModule(id: number) {
  return service.get(id);
}

export async function getLecturesModules(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function createLecturesModule(lecturesModule: LecturesModule) {
  return service.create(lecturesModule);
}

export async function updateLecturesModule(
  id: number,
  lecturesModule: LecturesModule,
) {
  return service.update(id, lecturesModule);
}

export async function deleteLecturesModule(id: number) {
  return service.delete(id);
}
