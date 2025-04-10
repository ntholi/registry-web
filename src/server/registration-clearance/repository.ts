import { auth } from '@/auth';
import { db } from '@/db';
import {
  DashboardUser,
  registrationClearanceAudit,
  registrationClearances,
  registrationRequests,
  requestedModules,
} from '@/db/schema';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { and, asc, count, desc, eq, inArray, like } from 'drizzle-orm';

type Model = typeof registrationClearances.$inferInsert;

export default class RegistrationClearanceRepository extends BaseRepository<
  typeof registrationClearances,
  'id'
> {
  constructor() {
    super(registrationClearances, 'id');
  }

  override async create(data: Model) {
    const session = await auth();

    const [inserted] = await db.transaction(async (tx) => {
      if (!session?.user?.id) throw new Error('Unauthorized');
      const [clearance] = await tx
        .insert(registrationClearances)
        .values(data)
        .returning();

      const modulesList = await tx.query.requestedModules.findMany({
        where: eq(
          requestedModules.registrationRequestId,
          data.registrationRequestId,
        ),
        with: {
          module: true,
        },
      });

      await tx.insert(registrationClearanceAudit).values({
        registrationClearanceId: clearance.id,
        previousStatus: null,
        newStatus: clearance.status,
        createdBy: session.user.id,
        message: clearance.message,
        modules: modulesList.map((rm) => rm.module.code),
      });

      return [clearance];
    });

    return inserted;
  }

  override async update(id: number, data: Model) {
    const session = await auth();

    const [updated] = await db.transaction(async (tx) => {
      if (!session?.user?.id) throw new Error('Unauthorized');
      const current = await tx
        .select()
        .from(registrationClearances)
        .where(eq(registrationClearances.id, id))
        .limit(1)
        .then(([result]) => result);

      if (!current) throw new Error('Registration clearance not found');

      const [clearance] = await tx
        .update(registrationClearances)
        .set(data)
        .where(eq(registrationClearances.id, id))
        .returning();

      if (data.status && data.status !== current.status) {
        const modulesList = await tx.query.requestedModules.findMany({
          where: eq(
            requestedModules.registrationRequestId,
            current.registrationRequestId,
          ),
          with: {
            module: true,
          },
        });

        await tx.insert(registrationClearanceAudit).values({
          registrationClearanceId: id,
          previousStatus: current.status,
          newStatus: clearance.status,
          createdBy: session.user.id,
          message: data.message,
          modules: modulesList.map((rm) => rm.module.code),
        });
      }

      return [clearance];
    });

    return updated;
  }

  async findById(id: number) {
    return await db.query.registrationClearances.findFirst({
      where: eq(registrationClearances.id, id),
      with: {
        registrationRequest: {
          with: {
            student: {
              with: {
                structure: {
                  with: {
                    program: true,
                  },
                },
              },
            },
            requestedModules: {
              with: {
                module: true,
              },
            },
          },
        },
        respondedBy: true,
      },
    });
  }

  async findByDepartment(
    department: DashboardUser,
    params: QueryOptions<typeof registrationClearances>,
    status?: 'pending' | 'approved' | 'rejected',
  ) {
    const { offset, limit } = this.buildQueryCriteria(params);

    const ids = await db.query.registrationRequests.findMany({
      where: like(registrationRequests.stdNo, `%${params.search}%`),
      columns: {
        id: true,
      },
    });
    const whereCondition = and(
      ids.length
        ? inArray(
            registrationClearances.registrationRequestId,
            ids.map((id) => id.id),
          )
        : undefined,
      eq(registrationClearances.department, department),
      status ? eq(registrationClearances.status, status) : undefined,
    );

    const data = await db.query.registrationClearances.findMany({
      where: whereCondition,
      with: {
        registrationRequest: {
          with: {
            student: true,
          },
        },
      },
      orderBy: asc(registrationClearances.createdAt),
      limit,
      offset,
    });

    return await this.createPaginatedResult(data, {
      limit,
      where: whereCondition,
    });
  }

  async countByStatus(
    status: 'pending' | 'approved' | 'rejected',
    department: DashboardUser,
  ) {
    const [result] = await db
      .select({ count: count() })
      .from(registrationClearances)
      .where(
        and(
          eq(registrationClearances.department, department),
          eq(registrationClearances.status, status),
        ),
      );
    return result.count;
  }

  async findHistory(clearanceId: number) {
    return db.query.registrationClearances.findMany({
      where: eq(registrationClearances.id, clearanceId),
      with: {
        registrationRequest: {
          with: {
            term: true,
          },
        },
        audits: {
          orderBy: desc(registrationClearanceAudit.date),
          with: {
            user: true,
          },
        },
      },
    });
  }

  async findNextPending(department: DashboardUser) {
    return db.query.registrationClearances.findFirst({
      where: and(
        eq(registrationClearances.status, 'pending'),
        eq(registrationClearances.department, department),
      ),
      with: {
        registrationRequest: {
          with: {
            student: true,
          },
        },
      },
      orderBy: (clearances) => [desc(clearances.createdAt)],
    });
  }
}

export const registrationClearancesRepository =
  new RegistrationClearanceRepository();
