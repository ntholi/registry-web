import { auth } from '@/auth';
import { db } from '@/db';
import {
  ModuleStatus,
  registrationClearances,
  registrationRequests,
  requestedModules,
  sponsoredStudents,
  students,
} from '@/db/schema';
import { MAX_REG_MODULES } from '@/lib/constants';
import BaseRepository, { FindAllParams } from '@/server/base/BaseRepository';
import { and, eq, or, like, sql, count } from 'drizzle-orm';

type Model = typeof registrationRequests.$inferInsert;
type RequestedModule = typeof requestedModules.$inferInsert;

export default class RegistrationRequestRepository extends BaseRepository<
  typeof registrationRequests,
  'id'
> {
  constructor() {
    super(registrationRequests, 'id');
  }

  override async findAll(params: FindAllParams<typeof registrationRequests>) {
    const { orderByExpressions, offset, pageSize } =
      await this.queryExpressions(params);

    const whereCondition = like(
      registrationRequests.stdNo,
      `%${params.search}%`,
    );

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
        student: {
          with: {
            structure: true,
          },
        },
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

  async findByStatus(
    status: 'pending' | 'registered' | 'rejected',
    params: FindAllParams<typeof registrationRequests>,
  ) {
    const { offset, pageSize } = await this.queryExpressions(params);

    const query = db.query.registrationRequests.findMany({
      where: and(
        eq(registrationRequests.status, status),
        params.search
          ? or(
              like(students.name, `%${params.search}%`),
              like(registrationRequests.stdNo, `%${params.search}%`),
            )
          : undefined,
      ),
      with: {
        student: true,
      },
      limit: pageSize,
      offset,
    });

    const [total, items] = await Promise.all([
      db
        .select({ value: count() })
        .from(registrationRequests)
        .where(
          and(
            eq(registrationRequests.status, status),
            params.search
              ? or(
                  like(students.name, `%${params.search}%`),
                  like(registrationRequests.stdNo, `%${params.search}%`),
                )
              : undefined,
          ),
        )
        .then((res) => res[0].value),
      query,
    ]);

    return {
      data: items,
      pages: Math.ceil(total / pageSize),
    };
  }

  async countByStatus(status: 'pending' | 'registered' | 'rejected') {
    const [result] = await db
      .select({ value: count() })
      .from(registrationRequests)
      .where(eq(registrationRequests.status, status));
    return result.value;
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
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    tx: any,
    registrationRequestId: number,
    modules: { moduleId: number; moduleStatus: ModuleStatus }[],
  ) {
    if (!modules.length) throw new Error('No modules selected');
    if (modules.length > MAX_REG_MODULES)
      throw new Error(`You can only select up to ${MAX_REG_MODULES} modules.`);

    await tx
      .delete(requestedModules)
      .where(eq(requestedModules.registrationRequestId, registrationRequestId));

    const modulesToCreate = modules.map((module) => ({
      moduleId: module.moduleId,
      moduleStatus: module.moduleStatus,
      registrationRequestId,
    }));

    return tx.insert(requestedModules).values(modulesToCreate).returning();
  }

  async createRegistrationWithModules(data: {
    stdNo: number;
    termId: number;
    modules: { moduleId: number; moduleStatus: ModuleStatus }[];
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
      await tx
        .insert(sponsoredStudents)
        .values({
          sponsorId: data.sponsorId,
          stdNo: data.stdNo,
          termId: data.termId,
          borrowerNo: data.borrowerNo,
        })
        .onConflictDoUpdate({
          target: [sponsoredStudents.stdNo, sponsoredStudents.termId],
          set: {
            borrowerNo: data.borrowerNo,
            sponsorId: data.sponsorId,
            updatedAt: new Date(),
          },
        });

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
        data.modules,
      );

      return { request, modules };
    });
  }

  async updateRegistrationWithModules(
    registrationRequestId: number,
    modules: { id: number; status: ModuleStatus }[],
    semesterNumber?: number,
    semesterStatus?: 'Active' | 'Repeat',
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
              registrationRequestId,
            ),
            eq(registrationClearances.department, 'finance'),
          ),
        );

      const convertedModules = modules.map((module) => ({
        moduleId: module.id,
        moduleStatus: module.status,
      }));

      return this.handleRegistrationModules(
        tx,
        registrationRequestId,
        convertedModules,
      );
    });
  }
}

export const registrationRequestsRepository =
  new RegistrationRequestRepository();
