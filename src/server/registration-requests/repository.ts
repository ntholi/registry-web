import BaseRepository from '@/server/base/BaseRepository';
import {
  registrationClearances,
  ModuleStatus,
  registrationRequests,
  requestedModules,
} from '@/db/schema';
import { db } from '@/db';
import { and, count, eq } from 'drizzle-orm';
import { MAX_REG_MODULES } from '@/lib/constants';

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

  async findByStdNo(stdNo: number, termId: number) {
    return db.query.registrationRequests.findFirst({
      where: and(
        eq(registrationRequests.stdNo, stdNo),
        eq(registrationRequests.termId, termId)
      ),
      with: {
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

  async getRequestedModules(registrationRequestId: number) {
    return db.query.requestedModules.findMany({
      where: eq(requestedModules.registrationRequestId, registrationRequestId),
      with: {
        module: true,
      },
    });
  }

  async createRequestedModules(modules: RequestedModule[]) {
    return db.insert(requestedModules).values(modules).returning();
  }

  async createRegistrationWithModules(data: {
    stdNo: number;
    termId: number;
    modules: { id: number; status: ModuleStatus }[];
  }) {
    if (!data.modules.length) throw new Error('No modules selected');
    if (data.modules.length > MAX_REG_MODULES)
      throw new Error(`You can only select up to ${MAX_REG_MODULES} modules.`);

    return await db.transaction(async (tx) => {
      const [request] = await tx
        .insert(registrationRequests)
        .values({
          stdNo: data.stdNo,
          termId: data.termId,
          status: 'pending',
        })
        .returning();

      ['finance', 'resource', 'library'].forEach(async (department) => {
        await tx
          .insert(registrationClearances)
          .values({
            registrationRequestId: request.id,
            department: department as 'finance' | 'resource' | 'library',
          })
          .returning();
      });

      const modulesToCreate = data.modules.map((module) => ({
        moduleId: module.id,
        moduleStatus: module.status,
        registrationRequestId: request.id,
      }));

      const modules = await tx
        .insert(requestedModules)
        .values(modulesToCreate)
        .returning();

      return { request, modules };
    });
  }

  async updateRegistrationWithModules(
    registrationRequestId: number,
    modules: { id: number; status: ModuleStatus }[]
  ) {
    await db.transaction(async (tx) => {
      await tx
        .update(registrationRequests)
        .set({
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(registrationRequests.id, registrationRequestId));

      await tx
        .delete(requestedModules)
        .where(
          eq(requestedModules.registrationRequestId, registrationRequestId)
        );

      await tx
        .update(registrationClearances)
        .set({
          status: 'pending',
        })
        .where(
          and(
            eq(
              registrationClearances.registrationRequestId,
              registrationRequestId
            ),
            eq(registrationClearances.department, 'finance')
          )
        );

      if (modules.length > 0) {
        await tx.insert(requestedModules).values(
          modules.map((module) => ({
            registrationRequestId,
            moduleId: module.id,
            moduleStatus: module.status,
          }))
        );
      }
    });
  }
}

export const registrationRequestsRepository =
  new RegistrationRequestRepository();
