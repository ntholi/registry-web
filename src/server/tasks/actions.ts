'use server';


import { tasks } from '@/db/schema';
import { tasksService as service} from './service';

type Task = typeof tasks.$inferInsert;


export async function getTask(id: string) {
  return service.get(id);
}

export async function getTasks(page: number = 1, search = '') {
  return service.getAll({ page, search });
}

export async function createTask(task: Task) {
  return service.create(task);
}

export async function updateTask(id: string, task: Partial<Task>) {
  return service.update(id, task);
}

export async function deleteTask(id: string) {
  return service.delete(id);
}