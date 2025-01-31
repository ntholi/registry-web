'use server';


import { clearanceResponses } from '@/db/schema';
import { clearanceResponsesService as service} from './service';

type ClearanceResponse = typeof clearanceResponses.$inferInsert;


export async function getClearanceResponse(id: number) {
  return service.get(id);
}

export async function findAllClearanceResponses(page: number = 1, search = '') {
  return service.findAll({ page, search });
}

export async function createClearanceResponse(clearanceResponse: ClearanceResponse) {
  return service.create(clearanceResponse);
}

export async function updateClearanceResponse(id: number, clearanceResponse: ClearanceResponse) {
  return service.update(id, clearanceResponse);
}

export async function deleteClearanceResponse(id: number) {
  return service.delete(id);
}