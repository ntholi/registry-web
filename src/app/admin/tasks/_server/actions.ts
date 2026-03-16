'use server';

import type { tasks } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { tasksService as service } from './service';
import type { TaskWithRelations } from './types';

type Task = typeof tasks.$inferInsert;
type TaskWithRelationsInput = Task & {
	assigneeIds?: string[];
	studentIds?: number[];
};
type TaskStatus = (typeof tasks.$inferSelect)['status'];
type TaskStatusFilter = TaskStatus | 'all' | 'open';

export async function getTask(id: string): Promise<TaskWithRelations | null> {
	return service.get(id) as Promise<TaskWithRelations | null>;
}

export async function findAllTasks(
	page = 1,
	search = '',
	statusFilter: TaskStatusFilter = 'open'
): Promise<{
	items: TaskWithRelations[];
	totalPages: number;
	totalItems: number;
}> {
	return service.findAll({ page, search, statusFilter }) as Promise<{
		items: TaskWithRelations[];
		totalPages: number;
		totalItems: number;
	}>;
}

export const createTask = createAction(
	async (task: TaskWithRelationsInput): Promise<typeof tasks.$inferSelect> =>
		service.create(task) as Promise<typeof tasks.$inferSelect>
);

export const updateTask = createAction(
	async (
		id: string,
		task: TaskWithRelationsInput
	): Promise<typeof tasks.$inferSelect> =>
		service.update(id, task) as Promise<typeof tasks.$inferSelect>
);

export const deleteTask = createAction(
	async (id: string): Promise<TaskWithRelations> =>
		service.delete(id) as Promise<TaskWithRelations>
);

export const updateTaskStatus = createAction(
	async (id: string, status: TaskStatus): Promise<typeof tasks.$inferSelect> =>
		service.updateStatus(id, status) as Promise<typeof tasks.$inferSelect>
);

export async function countUncompletedTasks() {
	return service.countUncompleted();
}

export async function getTodoTaskSummary(): Promise<{
	todoCount: number;
	hasUrgentTodo: boolean;
}> {
	return service.getTodoSummary() as Promise<{
		todoCount: number;
		hasUrgentTodo: boolean;
	}>;
}
