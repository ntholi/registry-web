import { clearance, DashboardUser } from '@/db/schema';
import GraduationClearanceRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../../base/BaseRepository';
import { auth } from '@/auth';
import { serviceWrapper } from '@/server/base/serviceWrapper';

type Clearance = typeof clearance.$inferInsert;

class GraduationClearanceService {
  constructor(
    private readonly repository = new GraduationClearanceRepository()
  ) {}

  async get(id: number) {
    return withAuth(
      async () => this.repository.findByIdWithRelations(id),
      ['dashboard']
    );
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
    params: QueryOptions<typeof clearance>,
    status?: 'pending' | 'approved' | 'rejected'
  ) {
    return withAuth(
      async () => this.repository.findByDepartment(department, params, status),
      ['dashboard']
    );
  }

  async update(id: number, data: Clearance) {
    return withAuth(async () => this.repository.update(id, data), []);
  }

  async respond(data: Clearance) {
    return withAuth(
      async (session) => {
        if (!data.id) throw Error('Clearance id cannot be null/undefined');
        return this.repository.update(data.id, {
          ...data,
          responseDate: new Date(),
          respondedBy: session?.user?.id,
        });
      },
      ['dashboard']
    );
  }

  async delete(id: number) {
    return withAuth(async () => this.repository.delete(id), []);
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
}

export const graduationClearanceService = serviceWrapper(
  GraduationClearanceService,
  'GraduationClearanceService'
);
