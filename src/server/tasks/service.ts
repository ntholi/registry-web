import { auth } from '@/auth';
import { DashboardUser, tasks } from '@/db/schema';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
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

      const { assignedUserIds, ...taskData } = data;

      const task = await this.repository.create({
        ...taskData,
        createdBy: session.user.id,
        department: session.user.role as DashboardUser,
        updatedAt: new Date(Date.now()),
      });

      if (assignedUserIds && assignedUserIds.length > 0) {
        await this.repository.assignTaskToUsers(task.id, assignedUserIds);
      }

      return task;
    }, ['dashboard']);
  }

  async update(id: string, data: Partial<TaskWithAssignments>) {
    return withAuth(async () => {
      const { assignedUserIds, ...taskData } = data;

      const task = await this.repository.update(id, {
        ...taskData,
        updatedAt: new Date(Date.now()),
      });

      if (assignedUserIds !== undefined) {
        await this.repository.assignTaskToUsers(id, assignedUserIds);
      }

      return task;
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
