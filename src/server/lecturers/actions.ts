'use server';

import { lecturersService as service } from './service';

export async function getLecturer(id: string) {
  return service.get(id);
}

export async function getLecturers(page: number = 1, search = '') {
  return service.getAll({ page, search });
}
