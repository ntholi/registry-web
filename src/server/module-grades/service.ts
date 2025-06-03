import { moduleGrades } from '@/db/schema';
import ModuleGradeRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';

type ModuleGrade = typeof moduleGrades.$inferInsert;

class ModuleGradeService {
  constructor(private readonly repository = new ModuleGradeRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getAll(params: QueryOptions<typeof moduleGrades>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: ModuleGrade) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: number, data: ModuleGrade) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }

  async findByModuleAndStudent(moduleId: number, stdNo: number) {
    return withAuth(
      async () => this.repository.findByModuleAndStudent(moduleId, stdNo),
      ['academic'],
    );
  }

  async getByModuleId(moduleId: number) {
    return withAuth(
      async () => this.repository.findByModuleId(moduleId),
      ['academic'],
    );
  }

  async upsertModuleGrade(data: ModuleGrade) {
    return withAuth(
      async () => this.repository.upsertModuleGrade(data),
      ['academic'],
    );
  }
}

export const moduleGradesService = new ModuleGradeService();
