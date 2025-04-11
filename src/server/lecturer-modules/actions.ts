'use server';

import { lecturesModulesService as service } from './service';
import { LecturesModule } from './types';

export async function getLecturesModule(id: number) {
  return service.get(id);
}

export async function getLecturesModules(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function createLecturesModule(lecturesModule: LecturesModule) {
  return service.create(lecturesModule.moduleId);
}

export async function deleteLecturesModule(id: number) {
  return service.delete(id);
}
