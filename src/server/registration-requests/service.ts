import {
  ModuleStatus,
  registrationRequests,
  requestedModules,
} from '@/db/schema';
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

  async getByStdNo(stdNo: number, termId: number) {
    return withAuth(
      async () => this.repository.findByStdNo(stdNo, termId),
      ['student'],
      async (session) => session.user?.stdNo === stdNo
    );
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
    return withAuth(
      async () => this.repository.create(data),
      ['student'],
      async (session) => session.user?.stdNo === data.stdNo
    );
  }

  async createRequestedModules(stdNo: number, modules: RequestedModule[]) {
    return withAuth(
      async () => this.repository.createRequestedModules(modules),
      ['student'],
      async (session) => session.user?.stdNo === stdNo
    );
  }

  async update(id: number, data: RegistrationRequest) {
    return withAuth(
      async () => this.repository.update(id, data),
      ['student'],
      async (session) => session.user?.stdNo === data.stdNo
    );
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }

  async createRegistrationWithModules(data: {
    stdNo: number;
    termId: number;
    modules: { id: number; status: ModuleStatus }[];
  }) {
    return withAuth(
      async () => this.repository.createRegistrationWithModules(data),
      ['student'],
      async (session) => session.user?.stdNo === data.stdNo
    );
  }
}

export const registrationRequestsService = new RegistrationRequestService();
