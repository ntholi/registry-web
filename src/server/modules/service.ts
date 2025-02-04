import { modules } from '@/db/schema';
import ModuleRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { FindAllParams } from '../base/BaseRepository';

type Module = typeof modules.$inferInsert;

class ModuleService {
  constructor(private readonly repository = new ModuleRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['dashboard']);
  }

  async findAll(params: FindAllParams<typeof modules>) {
    return withAuth(async () => this.repository.findAll(params), ['dashboard']);
  }

  async create(data: Module) {
    return withAuth(async () => this.repository.create(data), ['dashboard']);
  }

  async update(id: number, data: Module) {
    return withAuth(
      async () => this.repository.update(id, data),
      ['dashboard']
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
      []
    );
  }

  async getSchools() {
    return withAuth(async () => this.repository.getSchools(), []);
  }

  async getProgramsBySchool(schoolId: number) {
    return withAuth(
      async () => this.repository.getProgramsBySchool(schoolId),
      []
    );
  }

  async getStructuresByProgram(programId: number) {
    return withAuth(
      async () => this.repository.getStructuresByProgram(programId),
      []
    );
  }
}

export const modulesService = new ModuleService();
