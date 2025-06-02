import { db } from '@/db';
import { users, userSchools } from '@/db/schema';
import BaseRepository from '@/server/base/BaseRepository';
import { and, eq, inArray } from 'drizzle-orm';
import { QueryOptions } from '../base/BaseRepository';

export default class UserRepository extends BaseRepository<typeof users, 'id'> {
  constructor() {
    super(users, 'id');
  }

  async getBySchools(schoolIds: number[], options: QueryOptions<typeof users>) {
    const userIdsInSchools = db
      .select({ userId: userSchools.userId })
      .from(userSchools)
      .where(inArray(userSchools.schoolId, schoolIds));

    const schoolFilter = inArray(users.id, userIdsInSchools);

    if (options.filter) {
      options.filter = and(options.filter, schoolFilter);
    } else {
      options.filter = schoolFilter;
    }
    return this.query(options);
  }

  async getUserSchools(userId: string) {
    return db.query.userSchools.findMany({
      where: eq(userSchools.userId, userId),
      with: {
        school: true,
      },
    });
  }

  async getUserSchoolIds(userId: string) {
    const data = await db
      .select({ schoolId: userSchools.schoolId })
      .from(userSchools)
      .where(eq(userSchools.userId, userId));
    return data.map((item) => item.schoolId);
  }
}

export const usersRepository = new UserRepository();
