'use server';

import { graduationLists } from '@/db/schema';
import { graduationListsService as service } from './service';

type GraduationList = typeof graduationLists.$inferInsert;

export async function getGraduationList(id: string) {
  return service.get(id);
}

export async function getGraduationLists(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function createGraduationList(graduationList: GraduationList) {
  return service.create(graduationList);
}

export async function updateGraduationList(
  id: string,
  graduationList: Partial<GraduationList>
) {
  return service.update(id, graduationList);
}

export async function deleteGraduationList(id: string) {
  return service.delete(id);
}
