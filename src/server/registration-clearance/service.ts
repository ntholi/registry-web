import { registrationClearances, DashboardUser } from '@/db/schema';
import RegistrationClearanceRepository from './repository';
import withAuth from '@/server/base/withAuth';
import { FindAllParams } from '../base/BaseRepository';

type RegistrationClearance = typeof registrationClearances.$inferInsert;

class RegistrationClearanceService {
  constructor(
    private readonly repository = new RegistrationClearanceRepository()
  ) {}

  async first() {
    return withAuth(async () => this.repository.findFirst(), []);
  }

  async get(id: number) {
    return withAuth(async () => this.repository.findById(id), ['dashboard']);
  }

  async findByDepartment(
    department: DashboardUser,
    params: FindAllParams<typeof registrationClearances>
  ) {
    return withAuth(
      async () => this.repository.findByDepartment(department, params),
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
          clearedBy: session?.user?.id,
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
}

export const registrationClearancesService = new RegistrationClearanceService();
