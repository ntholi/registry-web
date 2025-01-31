import { registrationRequests, requestedModules } from '@/db/schema';
import RegistrationRequestRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { FindAllParams } from '../base/BaseRepository';

type RegistrationRequest = typeof registrationRequests.$inferInsert;
type RequestedModule = typeof requestedModules.$inferInsert;

class RegistrationRequestService {
  constructor(
    private readonly repository = new RegistrationRequestRepository()
  ) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async pending() {
    return withAuth(async () => this.repository.pending(), ['registry']);
  }

  async countPending() {
    return withAuth(async () => this.repository.countPending(), ['registry']);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), []);
  }

  async findAll(params: FindAllParams<typeof registrationRequests>) {
    return withAuth(async () => this.repository.findAll(params), []);
  }

  async create(data: RegistrationRequest) {
    return withAuth(async () => this.repository.create(data), []);
  }

  async createRequestedModules(modules: RequestedModule[]) {
    return withAuth(async () => this.repository.createRequestedModules(modules), []);
  }

  async update(id: number, data: RegistrationRequest) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }
}

export const registrationRequestsService = new RegistrationRequestService();
