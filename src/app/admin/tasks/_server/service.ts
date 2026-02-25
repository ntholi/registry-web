import type { Session } from 'next-auth';
import type { ActivityType } from '@/app/admin/activity-tracker/_lib/activity-catalog';
import type { tasks, UserRole } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import TaskRepository, { type TaskInsert } from './repository';

type TaskStatus = (typeof tasks.$inferSelect)['status'];
type TaskStatusFilter = TaskStatus | 'all' | 'open';

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
		params: { page?: number; search?: string; statusFilter?: TaskStatusFilter },
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
				statusFilter: params.statusFilter,
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

	async getTodoSummary() {
		return withAuth(async (session) => {
			const userId = session?.user?.id;
			const isManager = session?.user?.position === 'manager';
			const isAdmin = session?.user?.role === 'admin';

			return this.repository.getTodoSummary(userId, isManager || isAdmin);
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
				{ userId: userId, activityType: 'task_created' }
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

			const activityType = resolveTaskUpdateIntent(
				existingTask,
				taskData,
				assigneeIds,
				studentIds
			);

			return this.repository.updateWithRelations(
				id,
				taskData,
				assigneeIds,
				studentIds,
				{ userId: userId!, activityType }
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

			await this.repository.deleteTask(id, {
				userId: userId!,
				activityType: 'task_deleted',
			});
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

			return this.repository.updateStatus(id, status, {
				userId: userId!,
				activityType: 'task_status_changed',
			});
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

type TaskWithRelations = Awaited<
	ReturnType<TaskRepository['findByIdWithRelations']>
>;

function resolveTaskUpdateIntent(
	existing: NonNullable<TaskWithRelations>,
	taskData: Partial<TaskInsert>,
	assigneeIds?: string[],
	studentIds?: number[]
): ActivityType {
	if (assigneeIds !== undefined) {
		const currentIds = existing.assignees.map((a) => a.user.id).sort();
		const newIds = [...assigneeIds].sort();
		if (
			currentIds.length !== newIds.length ||
			currentIds.some((id, i) => id !== newIds[i])
		) {
			return 'task_assignees_changed';
		}
	}

	if (studentIds !== undefined) {
		const currentIds = existing.students.map((s) => s.student.stdNo).sort();
		const newIds = [...studentIds].sort();
		if (
			currentIds.length !== newIds.length ||
			currentIds.some((id, i) => id !== newIds[i])
		) {
			return 'task_students_changed';
		}
	}

	if (
		taskData.priority !== undefined &&
		taskData.priority !== existing.priority
	)
		return 'task_priority_changed';

	if (taskData.dueDate !== undefined && taskData.dueDate !== existing.dueDate)
		return 'task_due_date_changed';

	if (taskData.status !== undefined && taskData.status !== existing.status)
		return 'task_status_changed';

	return 'task_updated';
}
