import BaseRepository from '@/server/base/BaseRepository';
import {
  ModuleStatus,
  registrationRequests,
  requestedModules,
} from '@/db/schema';
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

  async findById(id: number) {
    return db.query.registrationRequests.findFirst({
      where: eq(registrationRequests.id, id),
      with: {
        student: true,
        term: true,
        requestedModules: {
          with: {
            module: true,
          },
        },
      },
    });
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

  async createRegistrationWithModules(data: {
    stdNo: number;
    termId: number;
    moduleIds: { moduleId: number; moduleStatus: ModuleStatus }[];
  }) {
    return await db.transaction(async (tx) => {
      const [request] = await tx
        .insert(registrationRequests)
        .values({
          stdNo: data.stdNo,
          termId: data.termId,
          status: 'pending',
        })
        .returning();

      const modulesToCreate = data.moduleIds.map((module) => ({
        ...module,
        registrationRequestId: request.id,
      }));

      const modules = await tx
        .insert(requestedModules)
        .values(modulesToCreate)
        .returning();

      return { request, modules };
    });
  }
}

export const registrationRequestsRepository =
  new RegistrationRequestRepository();
