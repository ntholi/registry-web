import { and, desc, eq, inArray, or, type SQL, sql } from 'drizzle-orm';
import { db, taskAssignees, tasks, type users } from '@/core/database';
import BaseRepository, {
	type QueryOptions,
} from '@/core/platform/BaseRepository';

export type TaskInsert = typeof tasks.$inferInsert;
export type TaskSelect = typeof tasks.$inferSelect;
export type TaskWithAssignees = TaskSelect & {
	assignees: { user: typeof users.$inferSelect }[];
	creator: typeof users.$inferSelect;
};

export default class TaskRepository extends BaseRepository<typeof tasks, 'id'> {
	constructor() {
		super(tasks, tasks.id);
	}

	async findByIdWithRelations(id: number): Promise<TaskWithAssignees | null> {
		const result = await db.query.tasks.findFirst({
			where: eq(tasks.id, id),
			with: {
				creator: true,
				assignees: {
					with: {
						user: true,
					},
				},
			},
		});
		return result ?? null;
	}

	async findAllWithRelations(
		options: QueryOptions<typeof tasks> & {
			userId?: string;
			isManager?: boolean;
		}
	) {
		const { page = 1, size = 15, search, userId, isManager } = options;
		const offset = (page - 1) * size;

		let baseFilter: SQL | undefined;

		if (!isManager && userId) {
			const assignedTaskIds = db
				.select({ taskId: taskAssignees.taskId })
				.from(taskAssignees)
				.where(eq(taskAssignees.userId, userId));

			baseFilter = or(
				eq(tasks.createdBy, userId),
				inArray(tasks.id, assignedTaskIds)
			);
		}

		let searchFilter: SQL | undefined;
		if (search) {
			searchFilter = or(
				sql`${tasks.title}::text ILIKE ${`%${search}%`}`,
				sql`${tasks.description}::text ILIKE ${`%${search}%`}`
			);
		}

		const whereClause =
			baseFilter && searchFilter
				? and(baseFilter, searchFilter)
				: baseFilter || searchFilter;

		const items = await db.query.tasks.findMany({
			where: whereClause,
			with: {
				creator: true,
				assignees: {
					with: {
						user: true,
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

	async createWithAssignees(
		task: TaskInsert,
		assigneeIds: string[]
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

			return created;
		});
	}

	async updateWithAssignees(
		id: number,
		task: Partial<TaskInsert>,
		assigneeIds?: string[]
	): Promise<TaskSelect> {
		return db.transaction(async (tx) => {
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

			return updated;
		});
	}

	async deleteTask(id: number): Promise<void> {
		await db.transaction(async (tx) => {
			await tx.delete(taskAssignees).where(eq(taskAssignees.taskId, id));
			await tx.delete(tasks).where(eq(tasks.id, id));
		});
	}

	async updateStatus(
		id: number,
		status: TaskSelect['status']
	): Promise<TaskSelect> {
		const updateData: Partial<TaskInsert> = {
			status,
			updatedAt: new Date(),
		};

		if (status === 'completed') {
			updateData.completedAt = new Date();
		}

		const [updated] = await db
			.update(tasks)
			.set(updateData)
			.where(eq(tasks.id, id))
			.returning();

		return updated;
	}

	async getTaskCountsByStatus(userId?: string, isManager?: boolean) {
		let whereClause: SQL | undefined;

		if (!isManager && userId) {
			const assignedTaskIds = db
				.select({ taskId: taskAssignees.taskId })
				.from(taskAssignees)
				.where(eq(taskAssignees.userId, userId));

			whereClause = or(
				eq(tasks.createdBy, userId),
				inArray(tasks.id, assignedTaskIds)
			);
		}

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
