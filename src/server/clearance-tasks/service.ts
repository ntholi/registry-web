import { clearanceTasks, DashboardUser } from '@/db/schema';
import ClearanceTaskRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { FindAllParams } from '../base/BaseRepository';
import { auth } from '@/auth';

type ClearanceTask = typeof clearanceTasks.$inferInsert;

class ClearanceTaskService {
  constructor(private readonly repository = new ClearanceTaskRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['dashboard']);
  }

  async findByDepartment(
    department: DashboardUser,
    params: FindAllParams<typeof clearanceTasks>
  ) {
    return withAuth(
      async () => this.repository.findByDepartment(department, params),
      ['dashboard']
    );
  }

  async create(data: ClearanceTask) {
    const session = await auth();
    return withAuth(
      async () =>
        this.repository.create({
          ...data,
          responseDate: new Date(),
          clearedBy: session?.user?.id,
        }),
      ['dashboard']
    );
  }

  async update(id: number, data: ClearanceTask) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const clearanceTasksService = new ClearanceTaskService();
