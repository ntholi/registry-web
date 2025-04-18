import { users } from '@/db/schema';
import withAuth from '@/server/base/withAuth';
import { QueryOptions } from '../base/BaseRepository';
import UserRepository from '../users/repository';

const academicAdmin = ['manager', 'program_leader', 'admin'] as const;

class LecturerService {
  constructor(private readonly repository = new UserRepository()) {}

  async get(id: string) {
    return withAuth(async () => this.repository.findById(id), ['academic']);
  }

  async getAll(params: QueryOptions<typeof users>) {
    return withAuth(
      async () => this.repository.query(params),
      ['academic'],
      async (session) => academicAdmin.includes(session.user?.academicRole),
    );
  }
}

export const lecturersService = new LecturerService();
