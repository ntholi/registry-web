import { clearanceTasks, DashboardUser } from '@/db/schema';
import ClearanceTaskRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { FindAllParams } from '../base/BaseRepository';

type ClearanceTask = typeof clearanceTasks.$inferInsert;

class ClearanceTaskService {
  constructor(private readonly repository = new ClearanceTaskRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async findByDepartment(
    department: DashboardUser,
    params: FindAllParams<typeof clearanceTasks>
  ) {
    return withAuth(
      async () => this.repository.findByDepartment(department, params),
      []
    );
  }

  async create(data: ClearanceTask) {
    return withAuth(async () => this.repository.create(data), []);
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
