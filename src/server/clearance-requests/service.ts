import { clearanceRequests } from '@/db/schema';
import ClearanceRequestRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { FindAllParams } from '../base/BaseRepository';

type ClearanceRequest = typeof clearanceRequests.$inferInsert;

class ClearanceRequestService {
  constructor(private readonly repository = new ClearanceRequestRepository()) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getByStdNo(termId: number, stdNo: number) {
    return withAuth(
      async () => this.repository.getByStdNo(termId, stdNo),
      ['student']
    );
  }

  async findAll(params: FindAllParams<typeof clearanceRequests>) {
    return withAuth(async () => this.repository.findAll(params), []);
  }

  async create(data: ClearanceRequest) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: number, data: ClearanceRequest) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const clearanceRequestsService = new ClearanceRequestService();
