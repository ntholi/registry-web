import { registrationClearances, DashboardUser } from '@/db/schema';
import RegistrationClearanceRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import { auth } from '@/auth';
import { serviceWrapper } from '@/server/base/serviceWrapper';

type RegistrationClearance = typeof registrationClearances.$inferInsert;

class RegistrationClearanceService {
  constructor(
    private readonly repository = new RegistrationClearanceRepository(),
  ) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['dashboard']);
  }

  async countByStatus(status: 'pending' | 'approved' | 'rejected') {
    const session = await auth();
    if (!session?.user?.role) return 0;

    return this.repository.countByStatus(
      status,
      session.user.role as DashboardUser,
    );
  }

  async findByDepartment(
    department: DashboardUser,
    params: QueryOptions<typeof registrationClearances>,
    status?: 'pending' | 'approved' | 'rejected',
  ) {
    return withAuth(
      async () => this.repository.findByDepartment(department, params, status),
      ['dashboard'],
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
      ['dashboard'],
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
      ['dashboard'],
    );
  }

  async findNextPending(department: DashboardUser) {
    return withAuth(
      async () => this.repository.findNextPending(department),
      ['dashboard'],
    );
  }
}

export const registrationClearancesService = serviceWrapper(
  RegistrationClearanceService,
  'RegistrationClearancesService',
);
