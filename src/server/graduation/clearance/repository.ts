import { auth } from '@/auth';
import { db } from '@/db';
import {
  DashboardUser,
  clearance,
  graduationClearance,
  graduationRequests,
  clearanceAudit,
  students,
} from '@/db/schema';
import BaseRepository, { QueryOptions } from '@/server/base/BaseRepository';
import { and, asc, count, desc, eq, inArray, like } from 'drizzle-orm';

type Model = typeof clearance.$inferInsert;

export default class GraduationClearanceRepository extends BaseRepository<
  typeof clearance,
  'id'
> {
  constructor() {
    super(clearance, 'id');
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
    const result = await db.query.clearance.findFirst({
      where: eq(clearance.id, id),
      with: {
        respondedBy: true,
        graduationClearances: {
          with: {
            graduationRequest: {
              with: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!result || result.graduationClearances.length === 0) return null;

    const { graduationClearances, ...rest } = result;
    return {
      ...rest,
      graduationRequest: graduationClearances[0].graduationRequest,
    };
  }

  async findByDepartment(
    department: DashboardUser,
    params: QueryOptions<typeof clearance>,
    status?: 'pending' | 'approved' | 'rejected'
  ) {
    const { offset, limit } = this.buildQueryCriteria(params);

    let clearanceIds: number[] = [];

    if (params.search) {
      const results = await db
        .select({ clearanceId: graduationClearance.clearanceId })
        .from(graduationClearance)
        .innerJoin(
          graduationRequests,
          eq(graduationClearance.graduationRequestId, graduationRequests.id)
        )
        .innerJoin(students, eq(graduationRequests.stdNo, students.stdNo))
        .where(
          and(
            params.search
              ? like(students.stdNo, `%${params.search}%`)
              : undefined
          )
        );

      clearanceIds = results.map((r) => r.clearanceId);

      if (params.search && clearanceIds.length === 0) {
        return { items: [], totalPages: 0, totalItems: 0 };
      }
    }

    const whereCondition = and(
      params.search && clearanceIds.length > 0
        ? inArray(clearance.id, clearanceIds)
        : undefined,
      eq(clearance.department, department),
      status ? eq(clearance.status, status) : undefined
    );

    const data = await db.query.clearance.findMany({
      where: whereCondition,
      with: {
        graduationClearances: {
          with: {
            graduationRequest: {
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

    const formatted = data.map((item) => {
      const { graduationClearances, ...rest } = item;
      return {
        ...rest,
        graduationRequest:
          graduationClearances.length > 0
            ? graduationClearances[0].graduationRequest
            : null,
      };
    });

    return this.createPaginatedResult(formatted, {
      limit,
      where: whereCondition,
    });
  }

  async countByStatus(
    status: 'pending' | 'approved' | 'rejected',
    department: DashboardUser
  ) {
    const [result] = await db
      .select({ count: count() })
      .from(clearance)
      .where(
        and(eq(clearance.department, department), eq(clearance.status, status))
      );
    return result.count;
  }
}
