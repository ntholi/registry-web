'use server';


import { blockedStudents } from '@/db/schema';
import { blockedStudentsService as service} from './service';

type BlockedStudent = typeof blockedStudents.$inferInsert;


export async function getBlockedStudent(id: number) {
  return service.get(id);
}

export async function getBlockedStudents(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function createBlockedStudent(blockedStudent: BlockedStudent) {
  return service.create(blockedStudent);
}

export async function updateBlockedStudent(id: number, blockedStudent: Partial<BlockedStudent>) {
  return service.update(id, blockedStudent);
}

export async function deleteBlockedStudent(id: number) {
  return service.delete(id);
}