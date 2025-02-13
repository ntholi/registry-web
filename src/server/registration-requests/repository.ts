import BaseRepository, { FindAllParams } from '@/server/base/BaseRepository';
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

  override async findAll(params: FindAllParams<typeof registrationRequests>) {
    const { orderByExpressions, whereCondition, offset, pageSize } =
      await this.queryExpressions(params);
    const data = await db.query.registrationRequests.findMany({
      where: whereCondition,
      with: {
        student: true,
      },
      orderBy: orderByExpressions,
      limit: pageSize,
      offset,
    });

    return await this.paginatedResults(data, whereCondition, pageSize);
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
        clearances: {
          with: {
            respondedBy: true,
          },
        },
      },
    });
  }

  async findByStdNo(stdNo: number, termId: number) {
    return db.query.registrationRequests.findFirst({
      where: and(
        eq(registrationRequests.stdNo, stdNo),
        eq(registrationRequests.termId, termId),
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

  private async handleRegistrationModules(
    tx: any,
    registrationRequestId: number,
    modules: { id: number; status: ModuleStatus }[],
  ) {
    if (!modules.length) throw new Error('No modules selected');
    if (modules.length > MAX_REG_MODULES)
      throw new Error(`You can only select up to ${MAX_REG_MODULES} modules.`);

    await tx
      .delete(requestedModules)
      .where(eq(requestedModules.registrationRequestId, registrationRequestId));

    const modulesToCreate = modules.map((module) => ({
      moduleId: module.id,
      moduleStatus: module.status,
      registrationRequestId,
    }));

    return tx.insert(requestedModules).values(modulesToCreate).returning();
  }

  async createRegistrationWithModules(data: {
    currentSemester: number;
    stdNo: number;
    termId: number;
    modules: { id: number; status: ModuleStatus }[];
  }) {
    // If every selected module's status begins with "Repeat", it implies that all chosen modules are repeat courses,
    // so we adjust by setting the semester to the previous one
    // Otherwise, we assume a progression to the next semester
    const semesterNumber = data.modules.every((it) =>
      it.status.startsWith('Repeat'),
    )
      ? data.currentSemester - 1
      : data.currentSemester + 1;

    return db.transaction(async (tx) => {
      const [request] = await tx
        .insert(registrationRequests)
        .values({
          stdNo: data.stdNo,
          termId: data.termId,
          status: 'pending',
          semesterNumber,
        })
        .returning();

      ['finance', 'library'].forEach(async (department) => {
        await tx
          .insert(registrationClearances)
          .values({
            registrationRequestId: request.id,
            department: department as 'finance' | 'library',
          })
          .returning();
      });

      const modules = await this.handleRegistrationModules(
        tx,
        request.id,
        data.modules,
      );

      return { request, modules };
    });
  }

  async updateRegistrationWithModules(
    registrationRequestId: number,
    modules: { id: number; status: ModuleStatus }[],
  ) {
    return db.transaction(async (tx) => {
      await tx
        .update(registrationRequests)
        .set({
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(registrationRequests.id, registrationRequestId));

      await tx
        .update(registrationClearances)
        .set({
          status: 'pending',
        })
        .where(
          and(
            eq(
              registrationClearances.registrationRequestId,
              registrationRequestId,
            ),
            eq(registrationClearances.department, 'finance'),
          ),
        );

      return this.handleRegistrationModules(tx, registrationRequestId, modules);
    });
  }
}

export const registrationRequestsRepository =
  new RegistrationRequestRepository();
