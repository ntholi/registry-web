import BaseRepository from '@/server/base/BaseRepository';
import { registrationRequests, requestedModules } from '@/db/schema';
import { db } from '@/db';
import { count, eq } from 'drizzle-orm';

type RequestedModule = typeof requestedModules.$inferInsert;

export default class RegistrationRequestRepository extends BaseRepository<
  typeof registrationRequests,
  'id'
> {
  constructor() {
    super(registrationRequests, 'id');
  }

  async pending() {
    return db.query.registrationRequests.findMany({
      where: eq(registrationRequests.status, 'pending'),
    });
  }

  async countPending() {
    const [{ count: value }] = await db
      .select({ count: count() })
      .from(registrationRequests)
      .where(eq(registrationRequests.status, 'pending'));

    return value;
  }

  async createRequestedModules(modules: RequestedModule[]) {
    return db.insert(requestedModules).values(modules).returning();
  }
}

export const registrationRequestsRepository =
  new RegistrationRequestRepository();
