import {
  StudentModuleStatus,
  registrationRequests,
  requestedModules,
} from '@/db/schema';
import { AcademicRemarks, Student } from '@/lib/helpers/students';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { getCurrentTerm } from '../terms/actions';
import RegistrationRequestRepository from './repository';

type RegistrationRequest = typeof registrationRequests.$inferInsert;
type RequestedModule = typeof requestedModules.$inferInsert;

type ModuleWithStatus = {
  semesterModuleId: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: 'Compulsory' | 'Elective' | `Repeat${number}`;
  semesterNo: number;
  prerequisites?: Array<{ id: number; code: string; name: string }>;
};

class RegistrationRequestService {
  constructor(
    private readonly repository = new RegistrationRequestRepository()
  ) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), ['registry']);
  }

  async getByStdNo(stdNo: number, termId: number) {
    return withAuth(
      async () => this.repository.findByStdNo(stdNo, termId),
      ['student'],
      async (session) => session.user?.stdNo === stdNo
    );
  }

  async getRequestedModules(registrationRequestId: number) {
    return withAuth(
      async () => this.repository.getRequestedModules(registrationRequestId),
      ['student']
    );
  }

  async getHistory(stdNo: number) {
    return withAuth(
      async () => this.repository.getHistory(stdNo),
      ['dashboard', 'student']
    );
  }

  async findByStatus(
    status: 'pending' | 'registered' | 'rejected' | 'approved',
    params: QueryOptions<typeof registrationRequests>,
    termId?: number
  ) {
    return withAuth(
      async () => this.repository.findByStatus(status, params, termId),
      ['registry', 'finance', 'library']
    );
  }

  async countByStatus(
    status: 'pending' | 'registered' | 'rejected' | 'approved'
  ) {
    const term = await getCurrentTerm();
    return withAuth(
      async () => this.repository.countByStatus(status, term.id),
      ['dashboard']
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
      ['dashboard', 'student'],
      async (session) =>
        session?.user?.role === 'admin' ||
        session?.user?.role === 'registry' ||
        session?.user?.position === 'admin' ||
        session?.user?.position === 'manager' ||
        session?.user?.position === 'program_leader' ||
        session?.user?.position === 'year_leader' ||
        session?.user?.role === 'student'
    );
  }

  async findAll(params: QueryOptions<typeof registrationRequests>) {
    return withAuth(async () => this.repository.query(params), ['registry']);
  }

  async create(data: RegistrationRequest) {
    return withAuth(
      async () => {
        return this.repository.create(data);
      },
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

  async update(id: number, data: Partial<RegistrationRequest>) {
    return withAuth(
      async () => this.repository.update(id, data),
      ['student', 'registry']
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
    bankName?: string;
    accountNumber?: string;
  }) {
    return withAuth(
      async () => {
        return this.repository.createRegistrationWithModules(data);
      },
      ['student', 'registry'],
      async (session) =>
        session.user?.stdNo === data.stdNo || session.user?.role === 'registry'
    );
  }

  async updateRegistrationWithModules(
    registrationRequestId: number,
    modules: { id: number; status: StudentModuleStatus }[],
    semesterNumber?: number,
    semesterStatus?: 'Active' | 'Repeat'
  ) {
    return withAuth(async () => {
      return this.repository.updateRegistrationWithModules(
        registrationRequestId,
        modules,
        semesterNumber,
        semesterStatus
      );
    }, ['student', 'registry']);
  }

  async updateRegistrationWithModulesAndSponsorship(
    registrationRequestId: number,
    modules: { id: number; status: StudentModuleStatus }[],
    sponsorshipData: {
      sponsorId: number;
      borrowerNo?: string;
      bankName?: string;
      accountNumber?: string;
    },
    semesterNumber?: number,
    semesterStatus?: 'Active' | 'Repeat'
  ) {
    return withAuth(async () => {
      return this.repository.updateRegistrationWithModulesAndSponsorship(
        registrationRequestId,
        modules,
        sponsorshipData,
        semesterNumber,
        semesterStatus
      );
    }, ['student', 'registry']);
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
  'RegistrationRequestsService'
);
