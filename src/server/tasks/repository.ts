import { db } from '@/db';
import { DashboardUser, taskAssignments, tasks, users } from '@/db/schema';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { and, desc, eq, gte, inArray, lte, or, SQL } from 'drizzle-orm';

export default class TaskRepository extends BaseRepository<typeof tasks, 'id'> {
  constructor() {
    super(tasks, 'id');
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
}

export const tasksRepository = new TaskRepository();
