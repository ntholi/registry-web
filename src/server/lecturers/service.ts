import { users, userSchools } from '@/db/schema';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import UserRepository from '../users/repository';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

const academicAdmin = ['manager', 'program_leader', 'admin'] as const;

class LecturerService {
  constructor(private readonly repository = new UserRepository()) {}

  async get(id: string) {
    return withAuth(async () => this.repository.findById(id), ['academic']);
  }

  async getAll(params: QueryOptions<typeof users>) {
    return withAuth(
      async (session) => {
        const isAdmin = academicAdmin.includes(
          session?.user?.position as (typeof academicAdmin)[number],
        );
        if (isAdmin) {
          return this.repository.query(params);
        }
        const userSchoolIds = await db.query.userSchools.findMany({
          where: eq(userSchools.userId, session?.user?.id as string),
          columns: {
            schoolId: true,
          },
        });
        const schoolIds = userSchoolIds.map((us) => us.schoolId);
        if (schoolIds.length === 0) {
          return {
            items: [],
            totalPages: 0,
            totalItems: 0,
          };
        }

        return this.repository.getBySchools(schoolIds, params);
      },
      ['academic'],
    );
  }
}

export const lecturersService = new LecturerService();
