import { and, eq, inArray, or, type SQL } from 'drizzle-orm';
import {
	type DashboardUser,
	db,
	taskAssignments,
	tasks,
	users,
} from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export default class TaskRepository extends BaseRepository<typeof tasks, 'id'> {
	constructor() {
		super(tasks, tasks.id);
	}

	async getTasksForUser(
		userId: string,
		department: string,
		options: QueryOptions<typeof tasks> = {}
	) {
		const { orderBy, where, offset, limit } = this.buildQueryCriteria(options);

		const assignedTaskIds = await db
			.select({ taskId: taskAssignments.taskId })
			.from(taskAssignments)
			.where(eq(taskAssignments.userId, userId));

		const taskIds = assignedTaskIds.map((t) => t.taskId);

		let taskWhere: SQL | undefined;

		if (taskIds.length > 0) {
			taskWhere = or(
				eq(tasks.department, department as DashboardUser),
				inArray(tasks.id, taskIds)
			);
		} else {
			taskWhere = eq(tasks.department, department as DashboardUser);
		}

		if (where) {
			taskWhere = and(taskWhere, where);
		}

		const items = await db
			.select()
			.from(tasks)
			.where(taskWhere)
			.orderBy(...orderBy)
			.limit(limit)
			.offset(offset);

		return await this.createPaginatedResult(items, { where: taskWhere, limit });
	}

	async getTaskWithAssignments(taskId: string) {
		const task = await this.findById(taskId);
		if (!task) return null;

		const assignments = await db
			.select({
				userId: taskAssignments.userId,
				userName: users.name,
				userEmail: users.email,
			})
			.from(taskAssignments)
			.innerJoin(users, eq(users.id, taskAssignments.userId))
			.where(eq(taskAssignments.taskId, taskId));

		return {
			...task,
			assignedUsers: assignments,
		};
	}

	async getUsersByDepartment(department: string) {
		return db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				position: users.position,
			})
			.from(users)
			.where(eq(users.role, department as DashboardUser))
			.orderBy(users.name);
	}

	async assignTaskToUsers(taskId: string, userIds: string[]) {
		await db.delete(taskAssignments).where(eq(taskAssignments.taskId, taskId));

		if (userIds.length === 0) return;

		const assignments = userIds.map((userId) => ({
			taskId,
			userId,
		}));

		await db.insert(taskAssignments).values(assignments);
	}

	async createWithAssignments(
		taskData: typeof tasks.$inferInsert,
		assignedUserIds: string[] = []
	) {
		return await db.transaction(async (tx) => {
			const [task] = await tx.insert(tasks).values(taskData).returning();

			if (assignedUserIds.length > 0) {
				const assignments = assignedUserIds.map((userId) => ({
					taskId: task.id,
					userId,
				}));

				await tx.insert(taskAssignments).values(assignments);
			}

			return task;
		});
	}

	async updateWithAssignments(
		taskId: string,
		taskData: Partial<typeof tasks.$inferInsert>,
		assignedUserIds?: string[]
	) {
		return await db.transaction(async (tx) => {
			const [task] = await tx
				.update(tasks)
				.set(taskData)
				.where(eq(tasks.id, taskId))
				.returning();

			if (assignedUserIds !== undefined) {
				await tx
					.delete(taskAssignments)
					.where(eq(taskAssignments.taskId, taskId));

				if (assignedUserIds.length > 0) {
					const assignments = assignedUserIds.map((userId) => ({
						taskId,
						userId,
					}));

					await tx.insert(taskAssignments).values(assignments);
				}
			}

			return task;
		});
	}
}

export const tasksRepository = new TaskRepository();
