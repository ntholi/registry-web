import type { QueryOptions } from '@server/base/BaseRepository';
import { auth } from '@/core/auth';
import type { DashboardUser, tasks } from '@/core/database/schema';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import withAuth from '@/server/base/withAuth';
import TaskRepository from './repository';

type Task = typeof tasks.$inferInsert;
type TaskWithAssignments = Task & {
	assignedUserIds?: string[];
};

class TaskService {
	constructor(private readonly repository = new TaskRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), ['dashboard']);
	}

	async get(id: string) {
		return withAuth(async () => {
			return this.repository.getTaskWithAssignments(id);
		}, ['dashboard']);
	}

	async getAll(params: QueryOptions<typeof tasks>) {
		return withAuth(async () => {
			const session = await auth();
			if (!session?.user?.id || !session.user.role) {
				throw new Error('Unauthorized');
			}

			return this.repository.getTasksForUser(
				session.user.id,
				session.user.role as DashboardUser,
				params
			);
		}, ['dashboard']);
	}

	async getDepartmentUsers(department?: DashboardUser) {
		return withAuth(async () => {
			const session = await auth();
			const dept = department || session?.user?.role;

			if (!dept) {
				throw new Error('Department not specified');
			}

			return this.repository.getUsersByDepartment(dept);
		}, ['dashboard']);
	}

	async create(data: TaskWithAssignments) {
		return withAuth(async () => {
			const session = await auth();
			if (!session?.user?.id || !session.user.role) {
				throw new Error('Unauthorized');
			}

			const { assignedUserIds = [], ...taskData } = data;

			return this.repository.createWithAssignments(
				{
					...taskData,
					createdBy: session.user.id,
					department: session.user.role as DashboardUser,
					updatedAt: new Date(Date.now()),
				},
				assignedUserIds
			);
		}, ['dashboard']);
	}

	async update(id: string, data: Partial<TaskWithAssignments>) {
		return withAuth(async () => {
			const { assignedUserIds, ...taskData } = data;

			return this.repository.updateWithAssignments(
				id,
				{
					...taskData,
					updatedAt: new Date(Date.now()),
				},
				assignedUserIds
			);
		}, ['dashboard']);
	}

	async updateStatus(id: string, status: typeof tasks.$inferSelect.status) {
		return withAuth(async () => {
			const updateData: Partial<Task> = {
				status,
				updatedAt: new Date(Date.now()),
			};

			if (status === 'completed') {
				updateData.completedAt = new Date(Date.now());
			}

			return this.repository.update(id, updateData);
		}, ['dashboard']);
	}

	async delete(id: string) {
		return withAuth(async () => {
			return this.repository.delete(id);
		}, ['dashboard']);
	}

	async count() {
		return withAuth(async () => this.repository.count(), ['dashboard']);
	}
}

export const tasksService = serviceWrapper(TaskService, 'Task');
