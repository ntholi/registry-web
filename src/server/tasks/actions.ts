'use server';

import { DashboardUser, tasks } from '@/db/schema';
import { tasksService as service } from './service';
import { eq } from 'drizzle-orm';

type Task = typeof tasks.$inferInsert;
type TaskWithAssignments = Task & { assignedUserIds?: string[] };

export async function getTask(id: string) {
  return service.get(id);
}

export async function getTasks(page: number = 1, search = '') {
  return service.getAll({
    page,
    search,
    searchColumns: ['title', 'description'],
    sort: [{ column: 'createdAt', order: 'desc' }],
  });
}

export async function getTasksByStatus(
  status: typeof tasks.$inferSelect.status,
  page: number = 1,
  search = ''
) {
  return service.getAll({
    page,
    search,
    searchColumns: ['title', 'description'],
    filter: eq(tasks.status, status),
    sort: [{ column: 'dueDate', order: 'asc' }],
  });
}

export async function getTasksByPriority(
  priority: typeof tasks.$inferSelect.priority,
  page: number = 1,
  search = ''
) {
  return service.getAll({
    page,
    search,
    searchColumns: ['title', 'description'],
    filter: eq(tasks.priority, priority),
    sort: [{ column: 'dueDate', order: 'asc' }],
  });
}

export async function getDepartmentUsers(department?: DashboardUser) {
  return service.getDepartmentUsers(department);
}

export async function createTask(task: TaskWithAssignments) {
  return service.create(task);
}

export async function updateTask(
  id: string,
  task: Partial<TaskWithAssignments>
) {
  return service.update(id, task);
}

export async function updateTaskStatus(
  id: string,
  status: typeof tasks.$inferSelect.status
) {
  return service.updateStatus(id, status);
}

export async function deleteTask(id: string) {
  return service.delete(id);
}
