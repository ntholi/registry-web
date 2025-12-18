'use server';

import type { tasks } from '@/core/database';
import type { TaskWithAssignees } from '../types';
import { tasksService as service } from './service';

type Task = typeof tasks.$inferInsert;
type TaskWithAssigneesInput = Task & { assigneeIds?: string[] };
type TaskStatus = (typeof tasks.$inferSelect)['status'];

export async function getTask(id: number): Promise<TaskWithAssignees | null> {
	return service.get(id) as Promise<TaskWithAssignees | null>;
}

export async function findAllTasks(
	page = 1,
	search = ''
): Promise<{
	items: TaskWithAssignees[];
	totalPages: number;
	totalItems: number;
}> {
	return service.findAll({ page, search }) as Promise<{
		items: TaskWithAssignees[];
		totalPages: number;
		totalItems: number;
	}>;
}

export async function createTask(
	task: TaskWithAssigneesInput
): Promise<typeof tasks.$inferSelect> {
	return service.create(task) as Promise<typeof tasks.$inferSelect>;
}

export async function updateTask(
	id: number,
	task: TaskWithAssigneesInput
): Promise<typeof tasks.$inferSelect> {
	return service.update(id, task) as Promise<typeof tasks.$inferSelect>;
}

export async function deleteTask(id: number): Promise<TaskWithAssignees> {
	return service.delete(id) as Promise<TaskWithAssignees>;
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
