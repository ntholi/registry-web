import { structures } from '@/db/schema';
import StructureRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { FindAllParams } from '../base/BaseRepository';

type Structure = typeof structures.$inferInsert;

class StructureService {
  constructor(private readonly repository = new StructureRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['dashboard']);
  }

  async findAll(params: FindAllParams<typeof structures>) {
    return withAuth(async () => this.repository.findAll(params), ['dashboard']);
  }

  async create(data: Structure) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: number, data: Structure) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async deleteSemesterModule(id: number) {
    withAuth(async () => this.repository.deleteSemesterModule(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const structuresService = new StructureService();
