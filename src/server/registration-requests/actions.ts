'use server';

import {
  ModuleStatus,
  registrationRequests,
  requestedModules,
} from '@/db/schema';
import { registrationRequestsService as service } from './service';

type RegistrationRequest = typeof registrationRequests.$inferInsert;
type RequestedModule = typeof requestedModules.$inferInsert;

export async function getRegistrationRequest(id: number) {
  return service.get(id);
}

export async function getRegistrationRequestByStdNo(
  stdNo: number,
  termId: number
) {
  return service.getByStdNo(stdNo, termId);
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

export async function createRegistrationRequest(value: RegistrationRequest) {
  return service.create(value);
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

export async function createRequestedModules(
  stdNo: number,
  modules: RequestedModule[]
) {
  return service.createRequestedModules(stdNo, modules);
}

export async function createRegistrationWithModules(data: {
  stdNo: number;
  termId: number;
  moduleIds: { moduleId: number; moduleStatus: ModuleStatus }[];
}) {
  return service.createRegistrationWithModules({
    stdNo: data.stdNo,
    termId: data.termId,
    moduleIds: data.moduleIds,
  });
}
