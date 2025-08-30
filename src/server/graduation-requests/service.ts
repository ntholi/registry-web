import { graduationRequests } from '@/db/schema';
import GraduationRequestRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '../base/serviceWrapper';

type GraduationRequest = typeof graduationRequests.$inferInsert;

class GraduationRequestService {
  constructor(
    private readonly repository = new GraduationRequestRepository()
  ) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async getAll(params: QueryOptions<typeof graduationRequests>) {
    return withAuth(async () => this.repository.query(params), []);
  }

  async create(data: GraduationRequest) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async update(id: number, data: Partial<GraduationRequest>) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const graduationRequestsService = serviceWrapper(
  GraduationRequestService,
  'GraduationRequest'
);
