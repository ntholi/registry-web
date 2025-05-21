import { modules } from '@/db/schema';
import ModuleRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';

type Module = typeof modules.$inferInsert;

class ModuleService {
  constructor(private readonly repository = new ModuleRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['academic']);
  }

  async getAll(params: QueryOptions<typeof modules>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: Module) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: number, data: Module) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const modulesService = new ModuleService();
