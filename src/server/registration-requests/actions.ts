'use server';

import { registrationRequests } from '@/db/schema';
import { registrationRequestsService as service } from './service';

type RegistrationRequest = typeof registrationRequests.$inferInsert;

export async function getRegistrationRequest(id: number) {
  return service.get(id);
}

export async function pendingRegistrationRequests() {
  return service.pending();
}

export async function countPendingRegistrationRequests() {
  return service.countPending();
}

export async function findAllRegistrationRequests(
  page: number = 1,
  search = ''
) {
  return service.findAll({ page, search });
}

export async function createRegistrationRequest(
  registrationRequest: RegistrationRequest
) {
  return service.create(registrationRequest);
}

export async function updateRegistrationRequest(
  id: number,
  registrationRequest: RegistrationRequest
) {
  return service.update(id, registrationRequest);
}

export async function deleteRegistrationRequest(id: number) {
  return service.delete(id);
}
