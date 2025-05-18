import { assignedModules } from '@/db/schema';
import AssignedModuleRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';

type AssignedModule = typeof assignedModules.$inferInsert;

class AssignedModuleService {
  constructor(private readonly repository = new AssignedModuleRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getAll(params: QueryOptions<typeof assignedModules>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: AssignedModule) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: number, data: AssignedModule) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }

  async assignModulesToLecturer(userId: number, semesterModuleIds: number[]) {
    return withAuth(async () => {
      await this.repository.removeModuleAssignments(semesterModuleIds);

      const assignments = semesterModuleIds.map((semesterModuleId) => ({
        userId,
        semesterModuleId,
      }));

      return this.repository.createMany(assignments);
    }, []);
  }
}

export const assignedModulesService = new AssignedModuleService();
