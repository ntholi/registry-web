'use server';

import { registrationClearances, DashboardUser } from '@/db/schema';
import { registrationClearancesService as service } from './service';
import { auth } from '@/auth';

type RegistrationClearance = typeof registrationClearances.$inferInsert;

export async function getRegistrationClearance(id: number) {
  return service.get(id);
}

export async function countPendingRegistrationClearances() {
  return service.countPending();
}

export async function registrationClearanceByDepartment(
  page: number = 1,
  search = '',
  showPending: boolean = true
) {
  const session = await auth();
  if (!session?.user?.role) {
    return {
      data: [],
      pages: 0,
    };
  }

  return service.findByDepartment(
    session.user.role as DashboardUser,
    {
      page,
      search,
    },
    showPending ? 'pending' : undefined
  );
}

export async function createRegistrationClearance(
  registrationClearance: RegistrationClearance
) {
  return service.respond(registrationClearance);
}

export async function updateRegistrationClearance(
  id: number,
  registrationClearance: RegistrationClearance
) {
  return service.update(id, registrationClearance);
}

export async function deleteRegistrationClearance(id: number) {
  return service.delete(id);
}

export async function getClearanceHistory(clearanceId: number) {
  return service.getHistory(clearanceId);
}
