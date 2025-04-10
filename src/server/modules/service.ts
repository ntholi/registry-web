import { modules } from '@/db/schema';
import ModuleRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '@/server/base/serviceWrapper';

type Module = typeof modules.$inferInsert;

class ModuleService {
  constructor(private readonly repository = new ModuleRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['dashboard']);
  }

  async getByCode(code: string) {
    return withAuth(
      async () => this.repository.findByCode(code),
      ['dashboard'],
    );
  }

  async findAll(params: QueryOptions<typeof modules>) {
    return withAuth(async () => this.repository.query(params), ['dashboard']);
  }

  async findModulesByStructure(structureId: number, search = '') {
    return withAuth(
      async () => this.repository.findModulesByStructure(structureId, search),
      ['dashboard'],
    );
  }

  async create(data: Module) {
    return withAuth(async () => this.repository.create(data), ['dashboard']);
  }

  async update(id: number, data: Module) {
    return withAuth(
      async () => this.repository.update(id, data),
      ['dashboard'],
    );
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }

  async getModulesByStructure(structureId: number) {
    return withAuth(
      async () => this.repository.getModulesByStructure(structureId),
      ['dashboard'],
    );
  }

  async getSchools() {
    return withAuth(async () => this.repository.getSchools(), ['dashboard']);
  }

  async getProgramsBySchool(schoolId: number) {
    return withAuth(
      async () => this.repository.getProgramsBySchool(schoolId),
      ['dashboard'],
    );
  }

  async getStructuresByProgram(programId: number) {
    return withAuth(
      async () => this.repository.getStructuresByProgram(programId),
      ['dashboard'],
    );
  }

  async addPrerequisite(moduleId: number, prerequisiteId: number) {
    return withAuth(
      async () => this.repository.addPrerequisite(moduleId, prerequisiteId),
      ['dashboard'],
    );
  }

  async clearPrerequisites(moduleId: number) {
    return withAuth(
      async () => this.repository.clearPrerequisites(moduleId),
      ['dashboard'],
    );
  }

  async getPrerequisites(moduleId: number) {
    return withAuth(
      async () => this.repository.getPrerequisites(moduleId),
      ['dashboard'],
    );
  }

  async getModulesForStructure(structureId: number) {
    return withAuth(
      async () => this.repository.getModulesForStructure(structureId),
      ['dashboard'],
    );
  }
}

export const modulesService = serviceWrapper(ModuleService, 'ModulesService');
