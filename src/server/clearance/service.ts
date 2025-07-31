import { registrationClearances, DashboardUser } from '@/db/schema';
import RegistrationClearanceRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { auth } from '@/auth';
import { serviceWrapper } from '@/server/base/serviceWrapper';

type RegistrationClearance = typeof registrationClearances.$inferInsert;

class RegistrationClearanceService {
  constructor(
    private readonly repository = new RegistrationClearanceRepository()
  ) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => {
      const result = await this.repository.findById(id);
      if (!result) return null;
      const activeProgram = result.registrationRequest.student.programs[0];
      return {
        ...result,
        programName: activeProgram?.structure.program.name,
      };
    }, ['dashboard']);
  }

  async countByStatus(status: 'pending' | 'approved' | 'rejected') {
    const session = await auth();
    if (!session?.user?.role) return 0;

    return this.repository.countByStatus(
      status,
      session.user.role as DashboardUser
    );
  }

  async findByDepartment(
    department: DashboardUser,
    params: QueryOptions<typeof registrationClearances>,
    status?: 'pending' | 'approved' | 'rejected',
    termId?: number
  ) {
    return withAuth(
      async () =>
        this.repository.findByDepartment(department, params, status, termId),
      ['dashboard']
    );
  }

  async respond(data: RegistrationClearance) {
    return withAuth(
      async (session) => {
        if (!data.id)
          throw Error('RegistrationClearance id cannot be null/undefined');
        return this.repository.update(data.id, {
          ...data,
          responseDate: new Date(),
          respondedBy: session?.user?.id,
        });
      },
      ['dashboard']
    );
  }

  async update(id: number, data: RegistrationClearance) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
  }

  async count() {
    return withAuth(async () => this.repository.count(), []);
  }

  async getHistory(clearanceId: number) {
    return withAuth(
      async () => this.repository.findHistory(clearanceId),
      ['dashboard']
    );
  }

  async getHistoryByStudentNo(stdNo: number) {
    return withAuth(async () => {
      const session = await auth();
      if (!session?.user?.role) throw new Error('Unauthorized');

      return this.repository.findHistoryByStudentNo(
        stdNo,
        session.user.role as DashboardUser
      );
    }, ['dashboard']);
  }

  async findNextPending(department: DashboardUser) {
    return withAuth(
      async () => this.repository.findNextPending(department),
      ['dashboard']
    );
  }

  async findByStatusForExport(
    status: 'pending' | 'approved' | 'rejected',
    termId?: number
  ) {
    return withAuth(
      async () => this.repository.findByStatusForExport(status, termId),
      ['dashboard']
    );
  }
}

export const registrationClearancesService = serviceWrapper(
  RegistrationClearanceService,
  'RegistrationClearancesService'
);
