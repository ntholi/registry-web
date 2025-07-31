import { db } from '@/db';
import {
  StudentModuleStatus,
  registrationClearances,
  registrationRequests,
  requestedModules,
  sponsoredStudents,
  sponsoredTerms,
  studentPrograms,
  terms,
} from '@/db/schema';
import { MAX_REG_MODULES } from '@/lib/constants';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import {
  and,
  count,
  desc,
  eq,
  exists,
  inArray,
  like,
  ne,
  not,
} from 'drizzle-orm';

type RequestedModule = typeof requestedModules.$inferInsert;

export default class RegistrationRequestRepository extends BaseRepository<
  typeof registrationRequests,
  'id'
> {
  constructor() {
    super(registrationRequests, 'id');
  }

  override async query(params: QueryOptions<typeof registrationRequests>) {
    const { orderBy, offset, limit } = this.buildQueryCriteria(params);

    const whereCondition = like(
      registrationRequests.stdNo,
      `%${params.search}%`
    );

    const data = await db.query.registrationRequests.findMany({
      where: whereCondition,
      with: {
        student: true,
      },
      orderBy,
      limit,
      offset,
    });

    return await this.createPaginatedResult(data, {
      where: whereCondition,
      limit,
    });
  }

  async findById(id: number) {
    return db.query.registrationRequests.findFirst({
      where: eq(registrationRequests.id, id),
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
        eq(registrationRequests.termId, termId)
      ),
      with: {
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
    });
  }

  async findByStatus(
    status: 'pending' | 'registered' | 'rejected' | 'approved',
    params: QueryOptions<typeof registrationRequests>
  ) {
    const { offset, limit } = this.buildQueryCriteria(params);

    let whereCondition;
    if (status === 'registered') {
      whereCondition = and(
        eq(registrationRequests.status, status),
        params.search
          ? like(registrationRequests.stdNo, `%${params.search}%`)
          : undefined
      );
    } else if (status === 'approved') {
      // For approved status, require ALL clearances to be approved
      const approvedRequestIds = db
        .select({ id: registrationRequests.id })
        .from(registrationRequests)
        .where(
          and(
            not(
              exists(
                db
                  .select()
                  .from(registrationClearances)
                  .where(
                    and(
                      eq(
                        registrationClearances.registrationRequestId,
                        registrationRequests.id
                      ),
                      ne(registrationClearances.status, 'approved')
                    )
                  )
              )
            ),
            exists(
              db
                .select()
                .from(registrationClearances)
                .where(
                  eq(
                    registrationClearances.registrationRequestId,
                    registrationRequests.id
                  )
                )
            ),
            ne(registrationRequests.status, 'registered')
          )
        );

      whereCondition = and(
        inArray(registrationRequests.id, approvedRequestIds),
        params.search
          ? like(registrationRequests.stdNo, `%${params.search}%`)
          : undefined
      );
    } else {
      whereCondition = and(
        inArray(
          registrationRequests.id,
          db
            .select({ id: registrationClearances.registrationRequestId })
            .from(registrationClearances)
            .where(eq(registrationClearances.status, status))
        ),
        params.search
          ? like(registrationRequests.stdNo, `%${params.search}%`)
          : undefined
      );
    }

    const query = db.query.registrationRequests.findMany({
      where: whereCondition,
      with: {
        student: true,
      },
      limit,
      offset,
    });

    const [total, items] = await Promise.all([
      db
        .select({ value: count() })
        .from(registrationRequests)
        .where(whereCondition)
        .then((res) => res[0].value),
      query,
    ]);

    return {
      data: items,
      pages: Math.ceil(total / limit),
    };
  }

  async countByStatus(
    status: 'pending' | 'registered' | 'rejected' | 'approved',
    termId?: number
  ) {
    if (status === 'registered') {
      const [result] = await db
        .select({ value: count() })
        .from(registrationRequests)
        .where(
          and(
            eq(registrationRequests.status, status),
            termId ? eq(registrationRequests.termId, termId) : undefined
          )
        );
      return result.value;
    } else if (status === 'approved') {
      // For approved status, require ALL clearances to be approved
      const [result] = await db
        .select({ value: count() })
        .from(registrationRequests)
        .where(
          and(
            not(
              exists(
                db
                  .select()
                  .from(registrationClearances)
                  .where(
                    and(
                      eq(
                        registrationClearances.registrationRequestId,
                        registrationRequests.id
                      ),
                      ne(registrationClearances.status, 'approved')
                    )
                  )
              )
            ),
            exists(
              db
                .select()
                .from(registrationClearances)
                .where(
                  eq(
                    registrationClearances.registrationRequestId,
                    registrationRequests.id
                  )
                )
            ),
            ne(registrationRequests.status, 'registered'),
            termId ? eq(registrationRequests.termId, termId) : undefined
          )
        );
      return result.value;
    } else {
      const [result] = await db
        .select({ value: count() })
        .from(registrationRequests)
        .where(
          and(
            exists(
              db
                .select()
                .from(registrationClearances)
                .where(
                  and(
                    eq(
                      registrationClearances.registrationRequestId,
                      registrationRequests.id
                    ),
                    eq(registrationClearances.status, status)
                  )
                )
            ),
            termId ? eq(registrationRequests.termId, termId) : undefined
          )
        );
      return result.value;
    }
  }

  async getRequestedModules(registrationRequestId: number) {
    return db.query.requestedModules.findMany({
      where: eq(requestedModules.registrationRequestId, registrationRequestId),
      with: {
        semesterModule: {
          with: {
            module: true,
          },
        },
      },
    });
  }

  async createRequestedModules(modules: RequestedModule[]) {
    return db.insert(requestedModules).values(modules).returning();
  }

  private async handleRegistrationModules(
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    tx: any,
    registrationRequestId: number,
    modules: { moduleId: number; moduleStatus: StudentModuleStatus }[]
  ) {
    if (!modules.length) throw new Error('No modules selected');
    if (modules.length > MAX_REG_MODULES)
      throw new Error(`You can only select up to ${MAX_REG_MODULES} modules.`);

    await tx
      .delete(requestedModules)
      .where(eq(requestedModules.registrationRequestId, registrationRequestId));
    const modulesToCreate = modules.map((module) => ({
      semesterModuleId: module.moduleId,
      moduleStatus: module.moduleStatus,
      registrationRequestId,
    }));

    return tx.insert(requestedModules).values(modulesToCreate).returning();
  }

  async createRegistrationWithModules(data: {
    stdNo: number;
    termId: number;
    modules: { moduleId: number; moduleStatus: StudentModuleStatus }[];
    sponsorId: number;
    semesterStatus: 'Active' | 'Repeat';
    semesterNumber: number;
    borrowerNo?: string;
  }) {
    return db.transaction(async (tx) => {
      const student = await tx.query.students.findFirst({
        where: (students, { eq }) => eq(students.stdNo, data.stdNo),
      });

      if (!student) {
        throw new Error('Student not found');
      }
      const [sponsoredStudent] = await tx
        .insert(sponsoredStudents)
        .values({
          sponsorId: data.sponsorId,
          stdNo: data.stdNo,
          borrowerNo: data.borrowerNo,
        })
        .onConflictDoUpdate({
          target: [sponsoredStudents.sponsorId, sponsoredStudents.stdNo],
          set: {
            borrowerNo: data.borrowerNo,
            updatedAt: new Date(),
          },
        })
        .returning();

      await tx
        .insert(sponsoredTerms)
        .values({
          sponsoredStudentId: sponsoredStudent.id,
          termId: data.termId,
        })
        .onConflictDoNothing();

      const [request] = await tx
        .insert(registrationRequests)
        .values({
          stdNo: data.stdNo,
          termId: data.termId,
          status: 'pending',
          semesterNumber: data.semesterNumber,
          semesterStatus: data.semesterStatus,
          sponsorId: data.sponsorId,
        })
        .returning();

      // Create clearance requests
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
        data.modules
      );

      return { request, modules };
    });
  }

  async updateRegistrationWithModules(
    registrationRequestId: number,
    modules: { id: number; status: StudentModuleStatus }[],
    semesterNumber?: number,
    semesterStatus?: 'Active' | 'Repeat'
  ) {
    return db.transaction(async (tx) => {
      await tx
        .update(registrationRequests)
        .set({
          status: 'pending',
          updatedAt: new Date(),
          semesterNumber,
          semesterStatus,
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
              registrationRequestId
            ),
            eq(registrationClearances.department, 'finance')
          )
        );

      const convertedModules = modules.map((module) => ({
        moduleId: module.id,
        moduleStatus: module.status,
      }));

      return this.handleRegistrationModules(
        tx,
        registrationRequestId,
        convertedModules
      );
    });
  }

  async updateRegistrationWithModulesAndSponsorship(
    registrationRequestId: number,
    modules: { id: number; status: StudentModuleStatus }[],
    sponsorshipData: { sponsorId: number; borrowerNo?: string },
    semesterNumber?: number,
    semesterStatus?: 'Active' | 'Repeat'
  ) {
    return db.transaction(async (tx) => {
      const registration = await tx.query.registrationRequests.findFirst({
        where: eq(registrationRequests.id, registrationRequestId),
      });

      if (!registration) {
        throw new Error('Registration request not found');
      }

      await tx
        .update(registrationRequests)
        .set({
          status: 'pending',
          updatedAt: new Date(),
          semesterNumber,
          semesterStatus,
          sponsorId: sponsorshipData.sponsorId,
        })
        .where(eq(registrationRequests.id, registrationRequestId));

      await tx
        .insert(sponsoredStudents)
        .values({
          sponsorId: sponsorshipData.sponsorId,
          stdNo: registration.stdNo,
          borrowerNo: sponsorshipData.borrowerNo,
        })
        .onConflictDoUpdate({
          target: [sponsoredStudents.sponsorId, sponsoredStudents.stdNo],
          set: {
            borrowerNo: sponsorshipData.borrowerNo,
            updatedAt: new Date(),
          },
        });

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

      const convertedModules = modules.map((module) => ({
        moduleId: module.id,
        moduleStatus: module.status,
      }));

      const moduleResults = await this.handleRegistrationModules(
        tx,
        registrationRequestId,
        convertedModules
      );

      return { request: registration, modules: moduleResults };
    });
  }

  async getHistory(stdNo: number) {
    return db
      .select({
        id: registrationRequests.id,
        status: registrationRequests.status,
        semesterNumber: registrationRequests.semesterNumber,
        createdAt: registrationRequests.createdAt,
        term: {
          id: terms.id,
          name: terms.name,
        },
        requestedModulesCount: count(requestedModules.id),
      })
      .from(registrationRequests)
      .innerJoin(terms, eq(registrationRequests.termId, terms.id))
      .leftJoin(
        requestedModules,
        eq(requestedModules.registrationRequestId, registrationRequests.id)
      )
      .where(eq(registrationRequests.stdNo, stdNo))
      .groupBy(
        registrationRequests.id,
        registrationRequests.status,
        registrationRequests.semesterNumber,
        registrationRequests.createdAt,
        terms.id,
        terms.name
      )
      .orderBy(desc(registrationRequests.createdAt));
  }
}

export const registrationRequestsRepository =
  new RegistrationRequestRepository();
