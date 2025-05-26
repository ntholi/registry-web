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
    return withAuth(async () => this.repository.delete(id), ['academic']);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }

  async assignModulesToLecturer(userId: string, semesterModuleIds: number[]) {
    return withAuth(async () => {
      await this.repository.removeModuleAssignments(userId, semesterModuleIds);
      const assignments = semesterModuleIds.map((semesterModuleId) => ({
        userId,
        semesterModuleId,
      }));

      return this.repository.createMany(assignments);
    }, ['academic']);
  }

  async getByUserAndModule(userId: string, moduleId: number) {
    return withAuth(
      async () => this.repository.findByUserAndModule(userId, moduleId),
      ['academic'],
    );
  }

  async getLecturersByModule(semesterModuleId: number) {
    return withAuth(
      async () => this.repository.findByModule(semesterModuleId),
      ['academic'],
    );
  }

  async getByUser(userId: string) {
    return withAuth(
      async () => this.repository.findByUser(userId),
      ['academic'],
    );
  }

  async getByUserGroupedByModule(userId: string) {
    const data = await this.getByUser(userId);
    type ResultType = (typeof data)[0];

    const moduleMap = new Map<number, ResultType>();
    data.forEach((item) => {
      const mod = item.semesterModule.module;
      if (mod) {
        moduleMap.set(mod.id, item);
      }
    });
    return Array.from(moduleMap.values());
  }

  async checkAssignment(userId: string, semesterModuleId: number) {
    return withAuth(
      async () => this.repository.findByUserAndModule(userId, semesterModuleId),
      ['academic'],
    );
  }
}

export const assignedModulesService = new AssignedModuleService();
