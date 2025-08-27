import { auth } from '@/auth';
import { db } from '@/db';
import {
  DashboardUser,
  clearanceAudit,
  clearance,
  registrationClearance,
  registrationRequests,
  requestedModules,
  studentPrograms,
} from '@/db/schema';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { and, asc, count, desc, eq, inArray, like } from 'drizzle-orm';

type Model = typeof clearance.$inferInsert;

export default class ClearanceRepository extends BaseRepository<
  typeof clearance,
  'id'
> {
  constructor() {
    super(clearance, 'id');
  }

  override async create(data: Model & { registrationRequestId: number }) {
    const session = await auth();

    const [inserted] = await db.transaction(async (tx) => {
      if (!session?.user?.id) throw new Error('Unauthorized');
      const [clearanceRecord] = await tx
        .insert(clearance)
        .values({
          department: data.department,
          status: data.status,
          message: data.message,
          emailSent: data.emailSent,
          respondedBy: data.respondedBy,
          responseDate: data.responseDate,
        })
        .returning();

      await tx.insert(registrationClearance).values({
        registrationRequestId: data.registrationRequestId,
        clearanceId: clearanceRecord.id,
      });

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

      await tx.insert(clearanceAudit).values({
        clearanceId: clearanceRecord.id,
        previousStatus: null,
        newStatus: clearanceRecord.status,
        createdBy: session.user.id,
        message: clearanceRecord.message,
        modules: modulesList.map((rm) => rm.semesterModule.module!.code),
      });

      return [clearanceRecord];
    });

    return inserted;
  }

  override async update(id: number, data: Partial<Model>) {
    const session = await auth();

    const [updated] = await db.transaction(async (tx) => {
      if (!session?.user?.id) throw new Error('Unauthorized');
      const current = await tx
        .select()
        .from(clearance)
        .where(eq(clearance.id, id))
        .limit(1)
        .then(([result]) => result);

      if (!current) throw new Error('Clearance not found');

      const [clearanceRecord] = await tx
        .update(clearance)
        .set(data)
        .where(eq(clearance.id, id))
        .returning();

      if (data.status && data.status !== current.status) {
        const regClearance = await tx.query.registrationClearance.findFirst({
          where: eq(registrationClearance.clearanceId, id),
        });

        if (regClearance) {
          const modulesList = await tx.query.requestedModules.findMany({
            where: eq(
              requestedModules.registrationRequestId,
              regClearance.registrationRequestId
            ),
            with: {
              semesterModule: {
                with: {
                  module: true,
                },
              },
            },
          });

          await tx.insert(clearanceAudit).values({
            clearanceId: id,
            previousStatus: current.status,
            newStatus: clearanceRecord.status,
            createdBy: session.user.id,
            message: data.message,
            modules: modulesList.map((rm) => rm.semesterModule.module!.code),
          });
        }
      }

      return [clearanceRecord];
    });

    return updated;
  }

  async findByIdWithRelations(id: number) {
    const clearanceData = await db.query.clearance.findFirst({
      where: eq(clearance.id, id),
      with: {
        respondedBy: true,
        registrationClearances: {
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
          },
        },
      },
    });

    if (!clearanceData || clearanceData.registrationClearances.length === 0) {
      return null;
    }

    const { registrationClearances, ...rest } = clearanceData;
    return {
      ...rest,
      registrationRequest: registrationClearances[0].registrationRequest,
    };
  }

  async findByDepartment(
    department: DashboardUser,
    params: QueryOptions<typeof clearance>,
    status?: 'pending' | 'approved' | 'rejected',
    termId?: number
  ) {
    const { offset, limit } = this.buildQueryCriteria(params);

    let clearanceIds: number[] = [];

    if (params.search || termId) {
      const results = await db
        .select({ clearanceId: registrationClearance.clearanceId })
        .from(registrationClearance)
        .innerJoin(
          registrationRequests,
          eq(
            registrationClearance.registrationRequestId,
            registrationRequests.id
          )
        )
        .where(
          and(
            params.search
              ? like(registrationRequests.stdNo, `%${params.search}%`)
              : undefined,
            termId ? eq(registrationRequests.termId, termId) : undefined
          )
        );

      clearanceIds = results.map((r) => r.clearanceId);

      if ((params.search || termId) && clearanceIds.length === 0) {
        return {
          items: [],
          totalPages: 0,
          totalItems: 0,
        };
      }
    }

    const whereCondition = and(
      (params.search || termId) && clearanceIds.length > 0
        ? inArray(clearance.id, clearanceIds)
        : undefined,
      eq(clearance.department, department),
      status ? eq(clearance.status, status) : undefined
    );

    const data = await db.query.clearance.findMany({
      where: whereCondition,
      with: {
        registrationClearances: {
          with: {
            registrationRequest: {
              with: {
                student: true,
              },
            },
          },
        },
      },
      orderBy: asc(clearance.createdAt),
      limit,
      offset,
    });

    const formattedData = data.map((item) => {
      const { registrationClearances, ...rest } = item;
      return {
        ...rest,
        registrationRequest:
          registrationClearances.length > 0
            ? registrationClearances[0].registrationRequest
            : null,
      };
    });

    return this.createPaginatedResult(formattedData, {
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
        .select({ id: clearance.id })
        .from(clearance)
        .innerJoin(
          registrationClearance,
          eq(clearance.id, registrationClearance.clearanceId)
        )
        .innerJoin(
          registrationRequests,
          eq(
            registrationClearance.registrationRequestId,
            registrationRequests.id
          )
        )
        .where(
          and(
            eq(clearance.department, department),
            eq(clearance.status, status),
            eq(registrationRequests.termId, termId)
          )
        );

      return clearanceIdsWithTerm.length;
    }

    const [result] = await db
      .select({ count: count() })
      .from(clearance)
      .where(
        and(eq(clearance.department, department), eq(clearance.status, status))
      );
    return result.count;
  }

  async findHistory(clearanceId: number) {
    const clearanceData = await db.query.clearance.findFirst({
      where: eq(clearance.id, clearanceId),
      with: {
        registrationClearances: {
          with: {
            registrationRequest: {
              with: {
                term: true,
              },
            },
          },
        },
        audits: {
          orderBy: desc(clearanceAudit.date),
          with: {
            user: true,
          },
        },
      },
    });

    if (!clearanceData) return [];

    const { registrationClearances, ...rest } = clearanceData;
    return [
      {
        ...rest,
        registrationRequest:
          registrationClearances.length > 0
            ? registrationClearances[0].registrationRequest
            : null,
      },
    ];
  }

  async findHistoryByStudentNo(stdNo: number, department: DashboardUser) {
    const results = await db
      .select({ clearanceId: clearance.id })
      .from(clearance)
      .innerJoin(
        registrationClearance,
        eq(clearance.id, registrationClearance.clearanceId)
      )
      .innerJoin(
        registrationRequests,
        eq(registrationClearance.registrationRequestId, registrationRequests.id)
      )
      .where(
        and(
          eq(registrationRequests.stdNo, stdNo),
          eq(clearance.department, department)
        )
      );

    const clearanceIds = results.map((r) => r.clearanceId);

    if (clearanceIds.length === 0) return [];

    const clearances = await db.query.clearance.findMany({
      where: inArray(clearance.id, clearanceIds),
      with: {
        registrationClearances: {
          with: {
            registrationRequest: {
              with: {
                term: true,
              },
            },
          },
        },
        audits: {
          orderBy: desc(clearanceAudit.date),
          with: {
            user: true,
          },
        },
      },
      orderBy: [desc(clearance.createdAt)],
    });

    return clearances.map((item) => {
      const { registrationClearances, ...rest } = item;
      return {
        ...rest,
        registrationRequest:
          registrationClearances.length > 0
            ? registrationClearances[0].registrationRequest
            : null,
      };
    });
  }

  async findNextPending(department: DashboardUser) {
    const clearanceData = await db.query.clearance.findFirst({
      where: and(
        eq(clearance.status, 'pending'),
        eq(clearance.department, department)
      ),
      with: {
        registrationClearances: {
          with: {
            registrationRequest: {
              with: {
                student: true,
              },
            },
          },
        },
      },
      orderBy: (clearances) => [desc(clearances.createdAt)],
    });

    if (!clearanceData) return null;

    const { registrationClearances, ...rest } = clearanceData;
    return {
      ...rest,
      registrationRequest:
        registrationClearances.length > 0
          ? registrationClearances[0].registrationRequest
          : null,
    };
  }

  async findByStatusForExport(
    status: 'pending' | 'approved' | 'rejected',
    termId?: number
  ) {
    if (termId) {
      const clearanceIdsWithTerm = await db
        .select({ id: clearance.id })
        .from(clearance)
        .innerJoin(
          registrationClearance,
          eq(clearance.id, registrationClearance.clearanceId)
        )
        .innerJoin(
          registrationRequests,
          eq(
            registrationClearance.registrationRequestId,
            registrationRequests.id
          )
        )
        .where(
          and(
            eq(clearance.status, status),
            eq(registrationRequests.termId, termId)
          )
        );

      if (clearanceIdsWithTerm.length === 0) {
        return [];
      }

      const clearances = await db.query.clearance.findMany({
        where: inArray(
          clearance.id,
          clearanceIdsWithTerm.map((c) => c.id)
        ),
        with: {
          registrationClearances: {
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
            },
          },
          respondedBy: true,
        },
        orderBy: [asc(clearance.createdAt)],
      });

      return clearances.map((item) => {
        const { registrationClearances, ...rest } = item;
        return {
          ...rest,
          registrationRequest:
            registrationClearances.length > 0
              ? registrationClearances[0].registrationRequest
              : null,
        };
      });
    }

    const clearances = await db.query.clearance.findMany({
      where: eq(clearance.status, status),
      with: {
        registrationClearances: {
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
          },
        },
        respondedBy: true,
      },
      orderBy: [asc(clearance.createdAt)],
    });

    return clearances.map((item) => {
      const { registrationClearances, ...rest } = item;
      return {
        ...rest,
        registrationRequest:
          registrationClearances.length > 0
            ? registrationClearances[0].registrationRequest
            : null,
      };
    });
  }
}

export const clearanceRepository = new ClearanceRepository();
