import { lecturesModules } from '@/db/schema';
import LecturesModuleRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';

type LecturesModule = typeof lecturesModules.$inferInsert;

class LecturesModuleService {
  constructor(private readonly repository = new LecturesModuleRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), ['academic']);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['academic']);
  }

  async getAll(params: QueryOptions<typeof lecturesModules>) {
    return withAuth(async () => this.repository.query(params), ['academic']);
  }

  async create(data: LecturesModule) {
    return withAuth(async () => this.repository.create(data), ['academic']);
  }

  async update(id: number, data: LecturesModule) {
    return withAuth(async () => this.repository.update(id, data), ['academic']);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), ['academic']);
  }

  async count() {
    return withAuth(async () => this.repository.count(), ['academic']);
  }
}

export const lecturesModulesService = new LecturesModuleService();
