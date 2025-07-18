import {
  StudentModuleStatus,
  registrationRequests,
  requestedModules,
} from '@/db/schema';
import RegistrationRequestRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import { AcademicRemarks, Student } from '@/lib/helpers/students';

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

  async getHistory(stdNo: number) {
    return withAuth(
      async () => this.repository.getHistory(stdNo),
      ['dashboard'],
    );
  }

  async findByStatus(
    status: 'pending' | 'registered' | 'rejected' | 'approved',
    params: QueryOptions<typeof registrationRequests>,
  ) {
    return withAuth(
      async () => this.repository.findByStatus(status, params),
      ['registry', 'finance', 'library'],
    );
  }

  async countByStatus(
    status: 'pending' | 'registered' | 'rejected' | 'approved',
  ) {
    return withAuth(
      async () => this.repository.countByStatus(status),
      ['dashboard'],
    );
  }

  async get(id: number) {
    return withAuth(
      async () => {
        const result = await this.repository.findById(id);
        if (!result) return null;
        const activeProgram = result.student.programs.at(0);
        return {
          ...result,
          programName: activeProgram?.structure.program.name,
          structureId: activeProgram?.structureId,
        };
      },
      ['dashboard'],
      async (session) =>
        session?.user?.role === 'admin' ||
        session?.user?.role === 'registry' ||
        session?.user?.position === 'admin' ||
        session?.user?.position === 'manager' ||
        session?.user?.position === 'program_leader' ||
        session?.user?.position === 'year_leader',
    );
  }

  async findAll(params: QueryOptions<typeof registrationRequests>) {
    return withAuth(async () => this.repository.query(params), ['registry']);
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
    modules: { moduleId: number; moduleStatus: StudentModuleStatus }[];
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
    modules: { id: number; status: StudentModuleStatus }[],
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

  async getStudentSemesterModules(student: Student, remarks: AcademicRemarks) {
    return withAuth(async () => {
      const { getStudentSemesterModulesLogic } = await import(
        './getStudentSemesterModules'
      );
      return getStudentSemesterModulesLogic(student, remarks);
    }, ['student', 'registry']);
  }
}

export const registrationRequestsService = serviceWrapper(
  RegistrationRequestService,
  'RegistrationRequestsService',
);
