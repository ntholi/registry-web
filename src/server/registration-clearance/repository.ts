import BaseRepository, { FindAllParams } from '@/server/base/BaseRepository';
import { registrationClearances, DashboardUser } from '@/db/schema';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';

export default class RegistrationClearanceRepository extends BaseRepository<
  typeof registrationClearances,
  'id'
> {
  constructor() {
    super(registrationClearances, 'id');
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
        clearedBy: true,
      },
    });
  }

  async findByDepartment(
    department: DashboardUser,
    params: FindAllParams<typeof registrationClearances>
  ) {
    const { orderByExpressions, whereCondition, offset, pageSize } =
      await this.queryExpressions(params);
    const data = await db.query.registrationClearances.findMany({
      where: and(
        whereCondition,
        eq(registrationClearances.department, department)
      ),
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
}

export const registrationClearancesRepository =
  new RegistrationClearanceRepository();
