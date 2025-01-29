import BaseRepository from '@/server/base/BaseRepository';
import { signups } from '@/db/schema';
import { db } from '@/db';

type SignUp = typeof signups.$inferInsert;

export default class SignupRepository extends BaseRepository<
  typeof signups,
  'userId'
> {
  constructor() {
    super(signups, 'userId');
  }

  async create(data: SignUp) {
    const [record] = await db
      .insert(signups)
      .values(data)
      .onConflictDoUpdate({
        target: signups.userId,
        set: {
          name: data.name,
          stdNo: data.stdNo,
          status: 'pending',
          message: 'Pending approval',
        },
      })
      .returning();
    return record;
  }
}

export const signupsRepository = new SignupRepository();
