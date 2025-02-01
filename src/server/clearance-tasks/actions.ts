'use server';

import { clearanceTasks, DashboardUser } from '@/db/schema';
import { clearanceTasksService as service } from './service';
import { auth } from '@/auth';

type ClearanceTask = typeof clearanceTasks.$inferInsert;

export async function getClearanceTask(id: number) {
  return service.get(id);
}

export async function clearanceTaskByDepartment(page: number = 1, search = '') {
  const session = await auth();
  if (!session?.user?.role) {
    return {
      data: [],
      pages: 0,
    };
  }

  return service.findByDepartment(session.user.role as DashboardUser, {
    page,
    search,
  });
}

export async function createClearanceTask(clearanceTask: ClearanceTask) {
  return service.respond(clearanceTask);
}

export async function updateClearanceTask(
  id: number,
  clearanceTask: ClearanceTask
) {
  return service.update(id, clearanceTask);
}

export async function deleteClearanceTask(id: number) {
  return service.delete(id);
}
