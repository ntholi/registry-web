import BaseRepository, { FindAllParams } from '@/server/base/BaseRepository';
import { clearanceTasks, DashboardUser } from '@/db/schema';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';

export default class ClearanceTaskRepository extends BaseRepository<
  typeof clearanceTasks,
  'id'
> {
  constructor() {
    super(clearanceTasks, 'id');
  }

  async findById(id: number) {
    return await db.query.clearanceTasks.findFirst({
      where: eq(clearanceTasks.id, id),
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
        clearedBy: true,
      },
    });
  }

  async findByDepartment(
    department: DashboardUser,
    params: FindAllParams<typeof clearanceTasks>
  ) {
    const { orderByExpressions, whereCondition, offset, pageSize } =
      await this.queryExpressions(params);
    const data = await db.query.clearanceTasks.findMany({
      where: and(whereCondition, eq(clearanceTasks.department, department)),
      with: {
        registrationRequest: {
          with: {
            student: true,
          },
        },
      },
      orderBy: orderByExpressions,
      limit: pageSize,
      offset,
    });

    return await this.paginatedResults(data, whereCondition, pageSize);
  }

  override async create(data: typeof clearanceTasks.$inferInsert) {
    const [record] = await db
      .insert(clearanceTasks)
      .values(data)
      .onConflictDoUpdate({
        target: clearanceTasks.id,
        set: data,
      })
      .returning();
    return record;
  }
}

export const clearanceTasksRepository = new ClearanceTaskRepository();
