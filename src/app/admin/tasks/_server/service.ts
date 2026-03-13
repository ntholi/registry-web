import type { AdminActivityType } from '@admin/_lib/activities';
import type { Session } from '@/core/auth';
import type { UserRole } from '@/core/auth/permissions';
import type { tasks } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import TaskRepository, { type TaskInsert } from './repository';

type TaskStatus = (typeof tasks.$inferSelect)['status'];
type TaskStatusFilter = TaskStatus | 'all' | 'open';

type VisibilityOpts = {
	userId?: string;
	userRole?: UserRole;
	hasDepartmentAccess: boolean;
	isAdmin: boolean;
};

function sessionVisibility(session?: Session | null): VisibilityOpts {
	return {
		userId: session?.user?.id,
		userRole: session?.user?.role as UserRole | undefined,
		hasDepartmentAccess:
			!!session?.user?.id &&
			!!session?.user?.role &&
			session.user.role !== 'admin',
		isAdmin: session?.user?.role === 'admin',
	};
}

class TaskService {
	private repository: TaskRepository;

	constructor() {
		this.repository = new TaskRepository();
	}

	async get(id: string) {
		return withPermission(
			async (session) => {
				const task = await this.repository.findByIdWithRelations(id);
				if (!task) return null;

				const { userId, userRole, hasDepartmentAccess, isAdmin } =
					sessionVisibility(session);
				const isCreator = task.createdBy === userId;
				const isAssignee = task.assignees.some((a) => a.user.id === userId);
				const hasRoleAssignee =
					hasDepartmentAccess && userRole
						? task.assignees.some((a) => a.user.role === userRole)
						: false;

				if (!isAdmin && !hasRoleAssignee && !isCreator && !isAssignee) {
					return null;
				}

				return task;
			},
			{ tasks: ['read'] }
		);
	}

	async findAll(params: {
		page?: number;
		search?: string;
		statusFilter?: TaskStatusFilter;
	}) {
		return withPermission(
			async (session) => {
				const vis = sessionVisibility(session);

				return this.repository.findAllWithRelations({
					page: params.page,
					search: params.search,
					statusFilter: params.statusFilter,
					...vis,
				});
			},
			{ tasks: ['read'] }
		);
	}

	async countUncompleted() {
		return withPermission(
			async (session) => {
				return this.repository.countUncompleted(sessionVisibility(session));
			},
			{ tasks: ['read'] }
		);
	}

	async getTodoSummary() {
		return withPermission(
			async (session) => {
				return this.repository.getTodoSummary(sessionVisibility(session));
			},
			{ tasks: ['read'] }
		);
	}

	async create(
		data: TaskInsert & { assigneeIds?: string[]; studentIds?: number[] }
	) {
		return withPermission(
			async (session) => {
				const { userId } = sessionVisibility(session);

				if (!userId) {
					throw new Error('User not authenticated');
				}

				let assigneeIds = data.assigneeIds || [];
				const studentIds = data.studentIds || [];

				if (assigneeIds.length === 0) {
					assigneeIds = [userId];
				}

				const taskData: TaskInsert = {
					title: data.title,
					description: data.description,
					priority: data.priority,
					status: data.status,
					dueDate: data.dueDate,
					createdBy: userId,
				};

				return this.repository.createWithRelations(
					taskData,
					assigneeIds,
					studentIds,
					{ userId: userId, activityType: 'task_created' }
				);
			},
			{ tasks: ['create'] }
		);
	}

	async update(
		id: string,
		data: Partial<TaskInsert> & {
			assigneeIds?: string[];
			studentIds?: number[];
		}
	) {
		return withPermission(
			async (session) => {
				const { userId, userRole, hasDepartmentAccess, isAdmin } =
					sessionVisibility(session);

				const existingTask = await this.repository.findByIdWithRelations(id);
				if (!existingTask) {
					throw new Error('Task not found');
				}

				const isCreator = existingTask.createdBy === userId;
				const isAssignee = existingTask.assignees.some(
					(a) => a.user.id === userId
				);
				const hasRoleAssignee =
					hasDepartmentAccess && userRole
						? existingTask.assignees.some((a) => a.user.role === userRole)
						: false;

				if (!isAdmin && !hasRoleAssignee && !isCreator && !isAssignee) {
					throw new Error('You do not have permission to update this task');
				}

				const assigneeIds = data.assigneeIds;

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
			},
			{ tasks: ['update'] }
		);
	}

	async delete(id: string) {
		return withPermission(
			async (session) => {
				const { userId, userRole, hasDepartmentAccess, isAdmin } =
					sessionVisibility(session);

				const existingTask = await this.repository.findByIdWithRelations(id);
				if (!existingTask) {
					throw new Error('Task not found');
				}

				const isCreator = existingTask.createdBy === userId;
				const hasRoleAssignee =
					hasDepartmentAccess && userRole
						? existingTask.assignees.some((a) => a.user.role === userRole)
						: false;

				if (!isAdmin && !isCreator && !hasRoleAssignee) {
					throw new Error(
						'Only the creator, manager, or admin can delete this task'
					);
				}

				await this.repository.deleteTask(id, {
					userId: userId!,
					activityType: 'task_deleted',
				});
				return existingTask;
			},
			{ tasks: ['delete'] }
		);
	}

	async updateStatus(
		id: string,
		status: (typeof tasks.$inferSelect)['status']
	) {
		return withPermission(
			async (session) => {
				const { userId, userRole, hasDepartmentAccess, isAdmin } =
					sessionVisibility(session);

				const existingTask = await this.repository.findByIdWithRelations(id);
				if (!existingTask) {
					throw new Error('Task not found');
				}

				const isCreator = existingTask.createdBy === userId;
				const isAssignee = existingTask.assignees.some(
					(a) => a.user.id === userId
				);
				const hasRoleAssignee =
					hasDepartmentAccess && userRole
						? existingTask.assignees.some((a) => a.user.role === userRole)
						: false;

				if (!isAdmin && !hasRoleAssignee && !isCreator && !isAssignee) {
					throw new Error(
						'You do not have permission to update this task status'
					);
				}

				return this.repository.updateStatus(id, status, {
					userId: userId!,
					activityType: 'task_status_changed',
				});
			},
			{ tasks: ['update'] }
		);
	}

	async getTaskCounts() {
		return withPermission(
			async (session) => {
				return this.repository.getTaskCountsByStatus(
					sessionVisibility(session)
				);
			},
			{ tasks: ['read'] }
		);
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
): AdminActivityType {
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
