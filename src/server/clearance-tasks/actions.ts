'use server';


import { clearanceTasks } from '@/db/schema';
import { clearanceTasksService as service} from './service';

type ClearanceTask = typeof clearanceTasks.$inferInsert;


export async function getClearanceTask(id: number) {
  return service.get(id);
}

export async function findAllClearanceTasks(page: number = 1, search = '') {
  return service.findAll({ page, search });
}

export async function createClearanceTask(clearanceTask: ClearanceTask) {
  return service.create(clearanceTask);
}

export async function updateClearanceTask(id: number, clearanceTask: ClearanceTask) {
  return service.update(id, clearanceTask);
}

export async function deleteClearanceTask(id: number) {
  return service.delete(id);
}