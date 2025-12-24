'use server';

import type { tasks } from '@/core/database';
import { tasksService as service } from './service';
import type { TaskWithRelations } from './types';

type Task = typeof tasks.$inferInsert;
type TaskWithRelationsInput = Task & {
	assigneeIds?: string[];
	studentIds?: number[];
};
type TaskStatus = (typeof tasks.$inferSelect)['status'];

export async function getTask(id: number): Promise<TaskWithRelations | null> {
	return service.get(id) as Promise<TaskWithRelations | null>;
}

export async function findAllTasks(
	page = 1,
	search = ''
): Promise<{
	items: TaskWithRelations[];
	totalPages: number;
	totalItems: number;
}> {
	return service.findAll({ page, search }) as Promise<{
		items: TaskWithRelations[];
		totalPages: number;
		totalItems: number;
	}>;
}

export async function createTask(
	task: TaskWithRelationsInput
): Promise<typeof tasks.$inferSelect> {
	return service.create(task) as Promise<typeof tasks.$inferSelect>;
}

export async function updateTask(
	id: number,
	task: TaskWithRelationsInput
): Promise<typeof tasks.$inferSelect> {
	return service.update(id, task) as Promise<typeof tasks.$inferSelect>;
}

export async function deleteTask(id: number): Promise<TaskWithRelations> {
	return service.delete(id) as Promise<TaskWithRelations>;
}

export async function updateTaskStatus(
	id: number,
	status: TaskStatus
): Promise<typeof tasks.$inferSelect> {
	return service.updateStatus(id, status) as Promise<typeof tasks.$inferSelect>;
}

export async function getTaskCounts() {
	return service.getTaskCounts();
}

export async function countUncompletedTasks() {
	return service.countUncompleted();
}
