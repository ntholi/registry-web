import { auth } from '@/auth';
import { db } from '@/db';
import {
  DashboardUser,
  registrationClearanceAudit,
  registrationClearances,
  registrationRequests,
  requestedModules,
  studentPrograms,
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
          data.registrationRequestId
        ),
        with: {
          semesterModule: {
            with: {
              module: true,
            },
          },
        },
      });

      await tx.insert(registrationClearanceAudit).values({
        registrationClearanceId: clearance.id,
        previousStatus: null,
        newStatus: clearance.status,
        createdBy: session.user.id,
        message: clearance.message,
        modules: modulesList.map((rm) => rm.semesterModule.module!.code),
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
            current.registrationRequestId
          ),
          with: {
            semesterModule: {
              with: {
                module: true,
              },
            },
          },
        });

        await tx.insert(registrationClearanceAudit).values({
          registrationClearanceId: id,
          previousStatus: current.status,
          newStatus: clearance.status,
          createdBy: session.user.id,
          message: data.message,
          modules: modulesList.map((rm) => rm.semesterModule.module!.code),
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
                programs: {
                  where: eq(studentPrograms.status, 'Active'),
                  orderBy: (programs, { asc }) => [asc(programs.id)],
                  limit: 1,
                  with: {
                    structure: {
                      with: {
                        program: true,
                      },
                    },
                  },
                },
              },
            },
            term: true,
            requestedModules: {
              with: {
                semesterModule: {
                  with: {
                    module: true,
                  },
                },
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
    termId?: number
  ) {
    const { offset, limit } = this.buildQueryCriteria(params);

    const ids = await db.query.registrationRequests.findMany({
      where: and(
        like(registrationRequests.stdNo, `%${params.search}%`),
        termId ? eq(registrationRequests.termId, termId) : undefined
      ),
      columns: {
        id: true,
      },
    });

    if (params.search && ids.length === 0) {
      return {
        items: [],
        totalPages: 0,
        totalItems: 0,
      };
    }

    const whereCondition = and(
      ids.length
        ? inArray(
            registrationClearances.registrationRequestId,
            ids.map((id) => id.id)
          )
        : undefined,
      eq(registrationClearances.department, department),
      status ? eq(registrationClearances.status, status) : undefined
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

    return this.createPaginatedResult(data, {
      limit,
      where: whereCondition,
    });
  }

  async countByStatus(
    status: 'pending' | 'approved' | 'rejected',
    department: DashboardUser,
    termId?: number
  ) {
    if (termId) {
      const clearanceIdsWithTerm = await db
        .select({ id: registrationClearances.id })
        .from(registrationClearances)
        .innerJoin(
          registrationRequests,
          eq(
            registrationClearances.registrationRequestId,
            registrationRequests.id
          )
        )
        .where(
          and(
            eq(registrationClearances.department, department),
            eq(registrationClearances.status, status),
            eq(registrationRequests.termId, termId)
          )
        );

      return clearanceIdsWithTerm.length;
    }

    const [result] = await db
      .select({ count: count() })
      .from(registrationClearances)
      .where(
        and(
          eq(registrationClearances.department, department),
          eq(registrationClearances.status, status)
        )
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

  async findHistoryByStudentNo(stdNo: number, department: DashboardUser) {
    return db
      .select()
      .from(registrationClearances)
      .innerJoin(
        registrationRequests,
        eq(
          registrationClearances.registrationRequestId,
          registrationRequests.id
        )
      )
      .where(
        and(
          eq(registrationRequests.stdNo, stdNo),
          eq(registrationClearances.department, department)
        )
      )
      .then(async (results) => {
        const clearanceIds = results.map((r) => r.registration_clearances.id);

        if (clearanceIds.length === 0) return [];

        return db.query.registrationClearances.findMany({
          where: inArray(registrationClearances.id, clearanceIds),
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
          orderBy: [desc(registrationClearances.createdAt)],
        });
      });
  }
  async findNextPending(department: DashboardUser) {
    return db.query.registrationClearances.findFirst({
      where: and(
        eq(registrationClearances.status, 'pending'),
        eq(registrationClearances.department, department)
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

  async findByStatusForExport(
    status: 'pending' | 'approved' | 'rejected',
    termId?: number
  ) {
    if (termId) {
      const clearanceIdsWithTerm = await db
        .select({ id: registrationClearances.id })
        .from(registrationClearances)
        .innerJoin(
          registrationRequests,
          eq(
            registrationClearances.registrationRequestId,
            registrationRequests.id
          )
        )
        .where(
          and(
            eq(registrationClearances.status, status),
            eq(registrationRequests.termId, termId)
          )
        );

      if (clearanceIdsWithTerm.length === 0) {
        return [];
      }

      return db.query.registrationClearances.findMany({
        where: inArray(
          registrationClearances.id,
          clearanceIdsWithTerm.map((c) => c.id)
        ),
        with: {
          registrationRequest: {
            with: {
              student: {
                with: {
                  programs: {
                    where: eq(studentPrograms.status, 'Active'),
                    orderBy: (programs, { asc }) => [asc(programs.id)],
                    limit: 1,
                    with: {
                      structure: {
                        with: {
                          program: true,
                        },
                      },
                    },
                  },
                },
              },
              term: true,
            },
          },
          respondedBy: true,
        },
        orderBy: [asc(registrationClearances.createdAt)],
      });
    }

    return db.query.registrationClearances.findMany({
      where: eq(registrationClearances.status, status),
      with: {
        registrationRequest: {
          with: {
            student: {
              with: {
                programs: {
                  where: eq(studentPrograms.status, 'Active'),
                  orderBy: (programs, { asc }) => [asc(programs.id)],
                  limit: 1,
                  with: {
                    structure: {
                      with: {
                        program: true,
                      },
                    },
                  },
                },
              },
            },
            term: true,
          },
        },
        respondedBy: true,
      },
      orderBy: [asc(registrationClearances.createdAt)],
    });
  }
}

export const registrationClearancesRepository =
  new RegistrationClearanceRepository();
