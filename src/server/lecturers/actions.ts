'use server';


import { lecturers } from '@/db/schema';
import { lecturersService as service} from './service';

type Lecturer = typeof lecturers.$inferInsert;


export async function getLecturer(id: number) {
  return service.get(id);
}

export async function getLecturers(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function createLecturer(lecturer: Lecturer) {
  return service.create(lecturer);
}

export async function updateLecturer(id: number, lecturer: Lecturer) {
  return service.update(id, lecturer);
}

export async function deleteLecturer(id: number) {
  return service.delete(id);
}