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
    private readonly repository = new RegistrationRequestRepository(),
  ) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), ['registry']);
  }

  async getByStdNo(stdNo: number, termId: number) {
    return withAuth(
      async () => this.repository.findByStdNo(stdNo, termId),
      ['student'],
      async (session) => session.user?.stdNo === stdNo,
    );
  }

  async getRequestedModules(registrationRequestId: number) {
    return withAuth(
      async () => this.repository.getRequestedModules(registrationRequestId),
      ['student'],
    );
  }

  async pending() {
    return withAuth(async () => this.repository.pending(), ['registry']);
  }

  async countPending() {
    return withAuth(async () => this.repository.countPending(), ['registry']);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['registry']);
  }

  async findAll(params: FindAllParams<typeof registrationRequests>) {
    return withAuth(async () => this.repository.findAll(params), ['registry']);
  }

  async create(data: RegistrationRequest) {
    return withAuth(
      async () => this.repository.create(data),
      ['student'],
      async (session) => session.user?.stdNo === data.stdNo,
    );
  }

  async createRequestedModules(stdNo: number, modules: RequestedModule[]) {
    return withAuth(
      async () => this.repository.createRequestedModules(modules),
      ['student'],
      async (session) => session.user?.stdNo === stdNo,
    );
  }

  async update(id: number, data: Partial<RegistrationRequest>) {
    return withAuth(
      async () => this.repository.update(id, data),
      ['student', 'registry'],
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
    modules: { moduleId: number; moduleStatus: ModuleStatus }[];
    sponsorId: number;
    semesterStatus: 'Active' | 'Repeat';
    semesterNumber: number;
    borrowerNo?: string;
  }) {
    return withAuth(
      async () => this.repository.createRegistrationWithModules(data),
      ['student', 'registry'],
      async (session) =>
        session.user?.stdNo === data.stdNo || session.user?.role === 'registry',
    );
  }

  async updateRegistrationWithModules(
    registrationRequestId: number,
    modules: { id: number; status: ModuleStatus }[],
    semesterNumber?: number,
    semesterStatus?: 'Active' | 'Repeat',
  ) {
    return withAuth(
      async () =>
        this.repository.updateRegistrationWithModules(
          registrationRequestId,
          modules,
          semesterNumber,
          semesterStatus,
        ),
      ['student', 'registry'],
    );
  }
}

export const registrationRequestsService = new RegistrationRequestService();
