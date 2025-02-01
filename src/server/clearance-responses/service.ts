import { clearanceResponses } from '@/db/schema';
import ClearanceResponseRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { FindAllParams } from '../base/BaseRepository';

type ClearanceResponse = typeof clearanceResponses.$inferInsert;

class ClearanceResponseService {
  constructor(
    private readonly repository = new ClearanceResponseRepository()
  ) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async findAll(params: FindAllParams<typeof clearanceResponses>) {
    return withAuth(async () => this.repository.findAll(params), []);
  }

  async create(data: ClearanceResponse) {
    return withAuth(async () => this.repository.create(data), ['dashboard']);
  }

  async update(id: number, data: ClearanceResponse) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const clearanceResponsesService = new ClearanceResponseService();
