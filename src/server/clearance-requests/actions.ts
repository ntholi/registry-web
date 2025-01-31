'use server';

import { clearanceRequests } from '@/db/schema';
import { clearanceRequestsService as service } from './service';

type ClearanceRequest = typeof clearanceRequests.$inferInsert;

export async function getClearanceRequest(id: number) {
  return service.get(id);
}

export async function getClearanceRequestByStdNo(
  termId: number,
  stdNo: number
) {
  return service.getByStdNo(termId, stdNo);
}

export async function findAllClearanceRequests(page: number = 1, search = '') {
  return service.findAll({ page, search });
}

export async function createClearanceRequest(value: ClearanceRequest) {
  return service.create(value);
}

export async function updateClearanceRequest(
  id: number,
  clearanceRequest: ClearanceRequest
) {
  return service.update(id, clearanceRequest);
}

export async function deleteClearanceRequest(id: number) {
  return service.delete(id);
}
