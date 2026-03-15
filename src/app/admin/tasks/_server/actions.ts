'use server';

import type { tasks } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { tasksService as service } from './service';
import type { TaskWithRelations } from './types';

type Task = typeof tasks.$inferInsert;
type TaskWithRelationsInput = Task & {
	assigneeIds?: string[];
	studentIds?: number[];
};
type TaskStatus = (typeof tasks.$inferSelect)['status'];
type TaskStatusFilter = TaskStatus | 'all' | 'open';

export const getTask = createAction(
	async (id: string): Promise<TaskWithRelations | null> => {
		return service.get(id) as Promise<TaskWithRelations | null>;
	}
);

export const findAllTasks = createAction(
	async (
		page: number = 1,
		search: string = '',
		statusFilter: TaskStatusFilter = 'open'
	): Promise<{
		items: TaskWithRelations[];
		totalPages: number;
		totalItems: number;
	}> => {
		return service.findAll({ page, search, statusFilter }) as Promise<{
			items: TaskWithRelations[];
			totalPages: number;
			totalItems: number;
		}>;
	}
);

export const createTask = createAction(
	async (task: TaskWithRelationsInput): Promise<typeof tasks.$inferSelect> => {
		return service.create(task) as Promise<typeof tasks.$inferSelect>;
	}
);

export const updateTask = createAction(
	async (
		id: string,
		task: TaskWithRelationsInput
	): Promise<typeof tasks.$inferSelect> => {
		return service.update(id, task) as Promise<typeof tasks.$inferSelect>;
	}
);

export const deleteTask = createAction(
	async (id: string): Promise<TaskWithRelations> => {
		return service.delete(id) as Promise<TaskWithRelations>;
	}
);

export const updateTaskStatus = createAction(
	async (
		id: string,
		status: TaskStatus
	): Promise<typeof tasks.$inferSelect> => {
		return service.updateStatus(id, status) as Promise<
			typeof tasks.$inferSelect
		>;
	}
);

export const countUncompletedTasks = createAction(async () => {
	return service.countUncompleted();
});

export const getTodoTaskSummary = createAction(
	async (): Promise<{
		todoCount: number;
		hasUrgentTodo: boolean;
	}> => {
		return service.getTodoSummary() as Promise<{
			todoCount: number;
			hasUrgentTodo: boolean;
		}>;
	}
);
