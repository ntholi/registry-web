import { and, desc, eq, inArray, or, type SQL, sql } from 'drizzle-orm';
import {
	db,
	type students,
	taskAssignees,
	taskStudents,
	tasks,
	type UserRole,
	users,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type TaskInsert = typeof tasks.$inferInsert;
export type TaskSelect = typeof tasks.$inferSelect;
export type TaskWithRelations = TaskSelect & {
	assignees: { user: typeof users.$inferSelect }[];
	students: { student: typeof students.$inferSelect }[];
	creator: typeof users.$inferSelect;
};

export default class TaskRepository extends BaseRepository<typeof tasks, 'id'> {
	constructor() {
		super(tasks, tasks.id);
	}

	private buildVisibilityFilter(opts: {
		userId?: string;
		userRole?: UserRole;
		isManager?: boolean;
		isAdmin?: boolean;
	}): SQL | undefined {
		const { userId, userRole, isManager, isAdmin } = opts;

		if (isAdmin) return undefined;

		if (isManager && userRole && userId) {
			const roleTaskIds = db
				.select({ taskId: taskAssignees.taskId })
				.from(taskAssignees)
				.innerJoin(users, eq(users.id, taskAssignees.userId))
				.where(eq(users.role, userRole));

			return or(eq(tasks.createdBy, userId), inArray(tasks.id, roleTaskIds));
		}

		if (userId) {
			const assignedTaskIds = db
				.select({ taskId: taskAssignees.taskId })
				.from(taskAssignees)
				.where(eq(taskAssignees.userId, userId));

			return or(
				eq(tasks.createdBy, userId),
				inArray(tasks.id, assignedTaskIds)
			);
		}

		return undefined;
	}

	async findByIdWithRelations(id: number): Promise<TaskWithRelations | null> {
		const result = await db.query.tasks.findFirst({
			where: eq(tasks.id, id),
			with: {
				creator: true,
				assignees: {
					with: {
						user: true,
					},
				},
				students: {
					with: {
						student: true,
					},
				},
			},
		});
		return result ?? null;
	}

	async findAllWithRelations(
		options: QueryOptions<typeof tasks> & {
			statusFilter?: TaskSelect['status'] | 'all' | 'open';
			userId?: string;
			userRole?: UserRole;
			isManager?: boolean;
			isAdmin?: boolean;
		}
	) {
		const {
			page = 1,
			size = 15,
			search,
			statusFilter = 'open',
			userId,
			userRole,
			isManager,
			isAdmin,
		} = options;
		const offset = (page - 1) * size;

		const baseFilter = this.buildVisibilityFilter({
			userId,
			userRole,
			isManager,
			isAdmin,
		});

		let searchFilter: SQL | undefined;
		if (search) {
			searchFilter = or(
				sql`${tasks.title}::text ILIKE ${`%${search}%`}`,
				sql`${tasks.description}::text ILIKE ${`%${search}%`}`
			);
		}

		let statusWhere: SQL | undefined;
		if (statusFilter === 'open') {
			statusWhere = and(
				sql`${tasks.status} != 'completed'`,
				sql`${tasks.status} != 'cancelled'`
			);
		} else if (statusFilter !== 'all') {
			statusWhere = eq(tasks.status, statusFilter);
		}

		const filters: SQL[] = [];
		if (baseFilter) filters.push(baseFilter);
		if (searchFilter) filters.push(searchFilter);
		if (statusWhere) filters.push(statusWhere);

		const whereClause =
			filters.length === 0
				? undefined
				: filters.length === 1
					? filters[0]
					: and(...filters);

		const items = await db.query.tasks.findMany({
			where: whereClause,
			with: {
				creator: true,
				assignees: {
					with: {
						user: true,
					},
				},
				students: {
					with: {
						student: true,
					},
				},
			},
			orderBy: [
				sql`CASE ${tasks.priority}
					WHEN 'urgent' THEN 1
					WHEN 'high' THEN 2
					WHEN 'medium' THEN 3
					WHEN 'low' THEN 4
				END`,
				desc(tasks.dueDate),
				desc(tasks.createdAt),
			],
			limit: size,
			offset,
		});

		const totalCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(tasks)
			.where(whereClause);

		const total = Number(totalCount[0]?.count ?? 0);

		return {
			items,
			totalPages: Math.ceil(total / size),
			totalItems: total,
		};
	}

	async countUncompleted(opts: {
		userId?: string;
		userRole?: UserRole;
		isManager?: boolean;
		isAdmin?: boolean;
	}) {
		const baseFilter = this.buildVisibilityFilter(opts);

		const statusFilter = and(
			sql`${tasks.status} != 'completed'`,
			sql`${tasks.status} != 'cancelled'`
		);

		const whereClause = baseFilter
			? and(baseFilter, statusFilter)
			: statusFilter;

		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(tasks)
			.where(whereClause);

		return Number(result[0]?.count ?? 0);
	}

	async getTodoSummary(opts: {
		userId?: string;
		userRole?: UserRole;
		isManager?: boolean;
		isAdmin?: boolean;
	}) {
		const baseFilter = this.buildVisibilityFilter(opts);

		const result = await db
			.select({
				todoCount: sql<number>`COALESCE(SUM(CASE WHEN ${tasks.status} = 'todo' THEN 1 ELSE 0 END), 0)`,
				urgentTodoCount: sql<number>`COALESCE(SUM(CASE WHEN ${tasks.status} = 'todo' AND ${tasks.priority} = 'urgent' THEN 1 ELSE 0 END), 0)`,
			})
			.from(tasks)
			.where(baseFilter);

		const todoCount = Number(result[0]?.todoCount ?? 0);
		const urgentTodoCount = Number(result[0]?.urgentTodoCount ?? 0);

		return {
			todoCount,
			hasUrgentTodo: urgentTodoCount > 0,
		};
	}

	async createWithRelations(
		task: TaskInsert,
		assigneeIds: string[],
		studentIds: number[],
		audit?: AuditOptions
	): Promise<TaskSelect> {
		return db.transaction(async (tx) => {
			const [created] = await tx.insert(tasks).values(task).returning();

			if (assigneeIds.length > 0) {
				await tx.insert(taskAssignees).values(
					assigneeIds.map((userId) => ({
						taskId: created.id,
						userId,
					}))
				);
			}

			if (studentIds.length > 0) {
				await tx.insert(taskStudents).values(
					studentIds.map((stdNo) => ({
						taskId: created.id,
						stdNo,
					}))
				);
			}

			if (audit) {
				await this.writeAuditLog(
					tx,
					'INSERT',
					String(created.id),
					null,
					created,
					audit
				);
			}

			return created;
		});
	}

	async updateWithRelations(
		id: number,
		task: Partial<TaskInsert>,
		assigneeIds?: string[],
		studentIds?: number[],
		audit?: AuditOptions
	): Promise<TaskSelect> {
		return db.transaction(async (tx) => {
			let existing: TaskSelect | undefined;
			if (audit) {
				const [row] = await tx.select().from(tasks).where(eq(tasks.id, id));
				existing = row;
			}

			const [updated] = await tx
				.update(tasks)
				.set({ ...task, updatedAt: new Date() })
				.where(eq(tasks.id, id))
				.returning();

			if (assigneeIds !== undefined) {
				await tx.delete(taskAssignees).where(eq(taskAssignees.taskId, id));

				if (assigneeIds.length > 0) {
					await tx.insert(taskAssignees).values(
						assigneeIds.map((userId) => ({
							taskId: id,
							userId,
						}))
					);
				}
			}

			if (studentIds !== undefined) {
				await tx.delete(taskStudents).where(eq(taskStudents.taskId, id));

				if (studentIds.length > 0) {
					await tx.insert(taskStudents).values(
						studentIds.map((stdNo) => ({
							taskId: id,
							stdNo,
						}))
					);
				}
			}

			if (audit && existing) {
				await this.writeAuditLog(
					tx,
					'UPDATE',
					String(id),
					existing,
					updated,
					audit
				);
			}

			return updated;
		});
	}

	async deleteTask(id: number, audit?: AuditOptions): Promise<void> {
		await db.transaction(async (tx) => {
			let existing: TaskSelect | undefined;
			if (audit) {
				const [row] = await tx.select().from(tasks).where(eq(tasks.id, id));
				existing = row;
			}

			await tx.delete(taskAssignees).where(eq(taskAssignees.taskId, id));
			await tx.delete(taskStudents).where(eq(taskStudents.taskId, id));
			await tx.delete(tasks).where(eq(tasks.id, id));

			if (audit && existing) {
				await this.writeAuditLog(
					tx,
					'DELETE',
					String(id),
					existing,
					null,
					audit
				);
			}
		});
	}

	async updateStatus(
		id: number,
		status: TaskSelect['status'],
		audit?: AuditOptions
	): Promise<TaskSelect> {
		const updateData: Partial<TaskInsert> = {
			status,
			updatedAt: new Date(),
		};

		if (status === 'completed') {
			updateData.completedAt = new Date();
		}

		return db.transaction(async (tx) => {
			let existing: TaskSelect | undefined;
			if (audit) {
				const [row] = await tx.select().from(tasks).where(eq(tasks.id, id));
				existing = row;
			}

			const [updated] = await tx
				.update(tasks)
				.set(updateData)
				.where(eq(tasks.id, id))
				.returning();

			if (audit && existing) {
				await this.writeAuditLog(
					tx,
					'UPDATE',
					String(id),
					existing,
					updated,
					audit
				);
			}

			return updated;
		});
	}

	async getTaskCountsByStatus(opts: {
		userId?: string;
		userRole?: UserRole;
		isManager?: boolean;
		isAdmin?: boolean;
	}) {
		const whereClause = this.buildVisibilityFilter(opts);

		const result = await db
			.select({
				status: tasks.status,
				count: sql<number>`count(*)`,
			})
			.from(tasks)
			.where(whereClause)
			.groupBy(tasks.status);

		return result;
	}
}
