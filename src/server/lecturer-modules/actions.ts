'use server';

import { z } from 'zod';
import { lecturesModulesService as service } from './service';

const lecturesModule = z.object({
  id: z.number().optional(),
  moduleId: z.number(),
});
type LecturesModule = z.infer<typeof lecturesModule>;

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
