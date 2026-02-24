import type { Session } from 'next-auth';
import type { tasks, UserRole } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import TaskRepository, { type TaskInsert } from './repository';

const ALLOWED_ROLES: UserRole[] = ['admin', 'registry', 'finance'];

class TaskService {
	private repository: TaskRepository;

	constructor() {
		this.repository = new TaskRepository();
	}

	async get(id: number) {
		return withAuth(async (session) => {
			const task = await this.repository.findByIdWithRelations(id);
			if (!task) return null;

			const userId = session?.user?.id;
			const isManager = session?.user?.position === 'manager';
			const isCreator = task.createdBy === userId;
			const isAssignee = task.assignees.some((a) => a.user.id === userId);
			const isAdmin = session?.user?.role === 'admin';

			if (!isAdmin && !isManager && !isCreator && !isAssignee) {
				return null;
			}

			return task;
		}, ALLOWED_ROLES);
	}

	async findAll(
		params: { page?: number; search?: string },
		session?: Session | null
	) {
		return withAuth(async (sess) => {
			const currentSession = sess ?? session;
			const userId = currentSession?.user?.id;
			const isManager = currentSession?.user?.position === 'manager';
			const isAdmin = currentSession?.user?.role === 'admin';

			return this.repository.findAllWithRelations({
				page: params.page,
				search: params.search,
				userId,
				isManager: isManager || isAdmin,
			});
		}, ALLOWED_ROLES);
	}

	async countUncompleted() {
		return withAuth(async (session) => {
			const userId = session?.user?.id;
			const isManager = session?.user?.position === 'manager';
			const isAdmin = session?.user?.role === 'admin';

			return this.repository.countUncompleted(userId, isManager || isAdmin);
		}, ALLOWED_ROLES);
	}

	async create(
		data: TaskInsert & { assigneeIds?: string[]; studentIds?: number[] },
		session?: Session | null
	) {
		return withAuth(async (sess) => {
			const currentSession = sess ?? session;
			const userId = currentSession?.user?.id;
			const isManager = currentSession?.user?.position === 'manager';
			const isAdmin = currentSession?.user?.role === 'admin';

			if (!userId) {
				throw new Error('User not authenticated');
			}

			let assigneeIds = data.assigneeIds || [];
			const studentIds = data.studentIds || [];

			if (!isManager && !isAdmin) {
				assigneeIds = [userId];
			}

			if (assigneeIds.length === 0) {
				assigneeIds = [userId];
			}

			const taskData: TaskInsert = {
				title: data.title,
				description: data.description,
				priority: data.priority,
				status: data.status,
				dueDate: data.dueDate,
				scheduledDate: data.scheduledDate,
				createdBy: userId,
			};

			return this.repository.createWithRelations(
				taskData,
				assigneeIds,
				studentIds,
				{ userId: userId }
			);
		}, ALLOWED_ROLES);
	}

	async update(
		id: number,
		data: Partial<TaskInsert> & {
			assigneeIds?: string[];
			studentIds?: number[];
		},
		session?: Session | null
	) {
		return withAuth(async (sess) => {
			const currentSession = sess ?? session;
			const userId = currentSession?.user?.id;
			const isManager = currentSession?.user?.position === 'manager';
			const isAdmin = currentSession?.user?.role === 'admin';

			const existingTask = await this.repository.findByIdWithRelations(id);
			if (!existingTask) {
				throw new Error('Task not found');
			}

			const isCreator = existingTask.createdBy === userId;
			const isAssignee = existingTask.assignees.some(
				(a) => a.user.id === userId
			);

			if (!isAdmin && !isManager && !isCreator && !isAssignee) {
				throw new Error('You do not have permission to update this task');
			}

			let assigneeIds = data.assigneeIds;
			if (!isManager && !isAdmin && assigneeIds !== undefined) {
				assigneeIds = undefined;
			}

			const { assigneeIds: _, studentIds, ...taskData } = data;

			return this.repository.updateWithRelations(
				id,
				taskData,
				assigneeIds,
				studentIds,
				{ userId: userId! }
			);
		}, ALLOWED_ROLES);
	}

	async delete(id: number) {
		return withAuth(async (session) => {
			const userId = session?.user?.id;
			const isAdmin = session?.user?.role === 'admin';

			const existingTask = await this.repository.findByIdWithRelations(id);
			if (!existingTask) {
				throw new Error('Task not found');
			}

			const isCreator = existingTask.createdBy === userId;

			if (!isAdmin && !isCreator) {
				throw new Error('Only the creator or admin can delete this task');
			}

			await this.repository.deleteTask(id, { userId: userId! });
			return existingTask;
		}, ALLOWED_ROLES);
	}

	async updateStatus(
		id: number,
		status: (typeof tasks.$inferSelect)['status']
	) {
		return withAuth(async (session) => {
			const userId = session?.user?.id;
			const isAdmin = session?.user?.role === 'admin';
			const isManager = session?.user?.position === 'manager';

			const existingTask = await this.repository.findByIdWithRelations(id);
			if (!existingTask) {
				throw new Error('Task not found');
			}

			const isCreator = existingTask.createdBy === userId;
			const isAssignee = existingTask.assignees.some(
				(a) => a.user.id === userId
			);

			if (!isAdmin && !isManager && !isCreator && !isAssignee) {
				throw new Error(
					'You do not have permission to update this task status'
				);
			}

			return this.repository.updateStatus(id, status, { userId: userId! });
		}, ALLOWED_ROLES);
	}

	async getTaskCounts() {
		return withAuth(async (session) => {
			const userId = session?.user?.id;
			const isManager = session?.user?.position === 'manager';
			const isAdmin = session?.user?.role === 'admin';

			return this.repository.getTaskCountsByStatus(
				userId,
				isManager || isAdmin
			);
		}, ALLOWED_ROLES);
	}
}

export const tasksService = serviceWrapper(TaskService, 'TasksService');
