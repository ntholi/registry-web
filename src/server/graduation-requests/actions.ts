'use server';


import { graduationRequests } from '@/db/schema';
import { graduationRequestsService as service} from './service';

type GraduationRequest = typeof graduationRequests.$inferInsert;


export async function getGraduationRequest(id: number) {
  return service.get(id);
}

export async function getGraduationRequests(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function createGraduationRequest(graduationRequest: GraduationRequest) {
  return service.create(graduationRequest);
}

export async function updateGraduationRequest(id: number, graduationRequest: Partial<GraduationRequest>) {
  return service.update(id, graduationRequest);
}

export async function deleteGraduationRequest(id: number) {
  return service.delete(id);
}