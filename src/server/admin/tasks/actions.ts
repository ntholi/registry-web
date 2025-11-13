'use server';

import { and, eq, inArray, type SQL } from 'drizzle-orm';
import { type DashboardUser, tasks } from '@/core/db/schema';
import { tasksService as service } from './service';

type Task = typeof tasks.$inferInsert;
type TaskWithAssignments = Task & { assignedUserIds?: string[] };

export type TaskFilter = {
	status?: string[];
	priority?: string[];
};

export async function getTask(id: string) {
	return service.get(id);
}

export async function getTasks(
	page: number = 1,
	search = '',
	filter?: TaskFilter
) {
	const filters: SQL[] = [];

	if (filter?.status && filter.status.length > 0) {
		filters.push(
			inArray(
				tasks.status,
				filter.status as (typeof tasks.$inferSelect.status)[]
			)
		);
	}

	if (filter?.priority && filter.priority.length > 0) {
		filters.push(
			inArray(
				tasks.priority,
				filter.priority as (typeof tasks.$inferSelect.priority)[]
			)
		);
	}

	return service.getAll({
		page,
		search,
		searchColumns: ['title', 'description'],
		filter: filters.length > 0 ? and(...filters) : undefined,
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
