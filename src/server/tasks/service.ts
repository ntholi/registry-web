import { tasks } from '@/db/schema';
import TaskRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '../base/serviceWrapper';

type Task = typeof tasks.$inferInsert;

class TaskService {
  constructor(private readonly repository = new TaskRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: string) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getAll(params: QueryOptions<typeof tasks>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: Task) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: string, data: Partial<Task>) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: string) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const tasksService = serviceWrapper(TaskService, 'Task');
