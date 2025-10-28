import { auth } from '@/auth';
import { db } from '@/db';
import {
  DashboardUser,
  clearance,
  graduationClearance,
  graduationRequests,
  clearanceAudit,
  students,
  studentPrograms,
  structures,
  programs,
  schools,
} from '@/db/schema';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { usersRepository } from '@/server/users/repository';
import { and, asc, count, desc, eq, inArray, like } from 'drizzle-orm';

type Model = typeof clearance.$inferInsert;

export default class GraduationClearanceRepository extends BaseRepository<
  typeof clearance,
  'id'
> {
  constructor() {
    super(clearance, clearance.id);
  }

  override async create(data: Model & { graduationRequestId: number }) {
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

      await tx.insert(graduationClearance).values({
        graduationRequestId: data.graduationRequestId,
        clearanceId: clearanceRecord.id,
      });

      await tx.insert(clearanceAudit).values({
        clearanceId: clearanceRecord.id,
        previousStatus: null,
        newStatus: clearanceRecord.status,
        createdBy: session.user.id,
        message: clearanceRecord.message,
        modules: [],
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
        await tx.insert(clearanceAudit).values({
          clearanceId: id,
          previousStatus: current.status,
          newStatus: clearanceRecord.status,
          createdBy: session.user.id,
          message: data.message,
          modules: [],
        });
      }

      return [clearanceRecord];
    });

    return updated;
  }

  async findByIdWithRelations(id: number) {
    const gc = await db.query.graduationClearance.findFirst({
      where: eq(graduationClearance.clearanceId, id),
      with: {
        clearance: { with: { respondedBy: true } },
        graduationRequest: {
          with: {
            studentProgram: {
              with: {
                student: true,
                structure: {
                  with: {
                    program: true,
                  },
                },
              },
            },
            paymentReceipts: true,
          },
        },
      },
    });

    if (!gc) return null;

    return {
      ...gc.clearance,
      graduationRequest: gc.graduationRequest,
    };
  }

  async findByDepartment(
    department: DashboardUser,
    params: QueryOptions<typeof clearance>,
    status?: 'pending' | 'approved' | 'rejected'
  ) {
    const session = await auth();
    const { offset, limit } = this.buildQueryCriteria(params);

    // Get user's school IDs if they are academic
    let userSchoolIds: number[] = [];
    if (session?.user?.role === 'academic' && session.user.id) {
      userSchoolIds = await usersRepository.getUserSchoolIds(session.user.id);
    }

    const baseWhereConditions = [
      params.search ? like(students.stdNo, `%${params.search}%`) : undefined,
      eq(clearance.department, department),
      status ? eq(clearance.status, status) : undefined,
    ].filter(Boolean);

    // Add school filter for academic users
    const schoolFilter =
      session?.user?.role === 'academic' && userSchoolIds.length > 0
        ? inArray(schools.id, userSchoolIds)
        : undefined;

    if (schoolFilter) {
      baseWhereConditions.push(schoolFilter);
    }

    const whereJoin = and(...baseWhereConditions);

    // Count query
    let countQuery = db
      .select({ total: count() })
      .from(graduationClearance)
      .innerJoin(
        graduationRequests,
        eq(graduationClearance.graduationRequestId, graduationRequests.id)
      )
      .innerJoin(
        studentPrograms,
        eq(graduationRequests.studentProgramId, studentPrograms.id)
      )
      .innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
      .innerJoin(clearance, eq(graduationClearance.clearanceId, clearance.id));

    // ID query
    let idQuery = db
      .select({ id: graduationClearance.id })
      .from(graduationClearance)
      .innerJoin(
        graduationRequests,
        eq(graduationClearance.graduationRequestId, graduationRequests.id)
      )
      .innerJoin(
        studentPrograms,
        eq(graduationRequests.studentProgramId, studentPrograms.id)
      )
      .innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
      .innerJoin(clearance, eq(graduationClearance.clearanceId, clearance.id));

    // Add school joins only if academic user
    if (session?.user?.role === 'academic') {
      countQuery = countQuery
        .innerJoin(structures, eq(studentPrograms.structureId, structures.id))
        .innerJoin(programs, eq(structures.programId, programs.id))
        .innerJoin(schools, eq(programs.schoolId, schools.id));

      idQuery = idQuery
        .innerJoin(structures, eq(studentPrograms.structureId, structures.id))
        .innerJoin(programs, eq(structures.programId, programs.id))
        .innerJoin(schools, eq(programs.schoolId, schools.id));
    }

    const [{ total }] = await countQuery.where(whereJoin);

    if (total === 0) {
      return { items: [], totalPages: 0, totalItems: 0 };
    }

    const idRows = await idQuery
      .where(whereJoin)
      .orderBy(asc(clearance.createdAt))
      .limit(limit)
      .offset(offset);

    const ids = idRows.map((r: { id: number }) => r.id);
    if (ids.length === 0) {
      return { items: [], totalPages: 0, totalItems: 0 };
    }

    const rows = await db.query.graduationClearance.findMany({
      where: inArray(graduationClearance.id, ids),
      with: {
        clearance: true,
        graduationRequest: {
          with: {
            studentProgram: {
              with: {
                student: true,
              },
            },
          },
        },
      },
    });

    const formatted = rows
      .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
      .map((gc) => ({
        ...gc.clearance,
        graduationRequest: gc.graduationRequest,
      }));

    return {
      items: formatted,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findHistory(clearanceId: number) {
    const gc = await db.query.graduationClearance.findFirst({
      where: eq(graduationClearance.clearanceId, clearanceId),
      with: {
        graduationRequest: true,
        clearance: {
          with: {
            audits: {
              orderBy: desc(clearanceAudit.date),
              with: { user: true },
            },
          },
        },
      },
    });

    if (!gc) return [];

    return [
      {
        ...gc.clearance,
        graduationRequest: gc.graduationRequest,
      },
    ];
  }

  async findHistoryByStudentNo(stdNo: number, department: DashboardUser) {
    const idRows = await db
      .select({ id: graduationClearance.id })
      .from(graduationClearance)
      .innerJoin(
        graduationRequests,
        eq(graduationClearance.graduationRequestId, graduationRequests.id)
      )
      .innerJoin(
        studentPrograms,
        eq(graduationRequests.studentProgramId, studentPrograms.id)
      )
      .innerJoin(clearance, eq(graduationClearance.clearanceId, clearance.id))
      .where(
        and(
          eq(studentPrograms.stdNo, stdNo),
          eq(clearance.department, department)
        )
      );

    const ids = idRows.map((r) => r.id);
    if (ids.length === 0) return [];

    const rows = await db.query.graduationClearance.findMany({
      where: inArray(graduationClearance.id, ids),
      with: {
        graduationRequest: true,
        clearance: {
          with: {
            audits: {
              orderBy: desc(clearanceAudit.date),
              with: { user: true },
            },
          },
        },
      },
      orderBy: (gcs, { desc: d }) => [d(gcs.createdAt)],
    });

    return rows.map((gc) => ({
      ...gc.clearance,
      graduationRequest: gc.graduationRequest,
    }));
  }

  async countByStatus(
    status: 'pending' | 'approved' | 'rejected',
    department: DashboardUser
  ) {
    const session = await auth();

    // Get user's school IDs if they are academic
    let userSchoolIds: number[] = [];
    if (session?.user?.role === 'academic' && session.user.id) {
      userSchoolIds = await usersRepository.getUserSchoolIds(session.user.id);
    }

    const baseWhereConditions = [
      eq(clearance.department, department),
      eq(clearance.status, status),
    ];

    // Add school filter for academic users
    const schoolFilter =
      session?.user?.role === 'academic' && userSchoolIds.length > 0
        ? inArray(schools.id, userSchoolIds)
        : undefined;

    if (schoolFilter) {
      baseWhereConditions.push(schoolFilter);
    }

    const whereCondition = and(...baseWhereConditions);

    let query = db
      .select({ count: count() })
      .from(graduationClearance)
      .innerJoin(clearance, eq(graduationClearance.clearanceId, clearance.id));

    // Add school joins only if academic user
    if (session?.user?.role === 'academic') {
      query = query
        .innerJoin(
          graduationRequests,
          eq(graduationClearance.graduationRequestId, graduationRequests.id)
        )
        .innerJoin(
          studentPrograms,
          eq(graduationRequests.studentProgramId, studentPrograms.id)
        )
        .innerJoin(students, eq(studentPrograms.stdNo, students.stdNo))
        .innerJoin(structures, eq(studentPrograms.structureId, structures.id))
        .innerJoin(programs, eq(structures.programId, programs.id))
        .innerJoin(schools, eq(programs.schoolId, schools.id));
    }

    const [result] = await query.where(whereCondition);
    return result.count;
  }
}
