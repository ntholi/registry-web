import { auth } from '@/auth';
import type { users } from '@/db/schema';
import withAuth from '@/server/base/withAuth';
import type { QueryOptions } from '../base/BaseRepository';
import { getUserSchoolIds } from '../users/actions';
import UserRepository from '../users/repository';

class LecturerService {
	constructor(private readonly repository = new UserRepository()) {}

	async get(id: string) {
		return withAuth(async () => this.repository.findById(id), ['academic']);
	}

	async getAll(params: QueryOptions<typeof users>) {
		const session = await auth();
		const userSchools = await getUserSchoolIds(session?.user?.id);
		return withAuth(
			async () => this.repository.getBySchools(userSchools, params),
			['academic'],
			async (session) => {
				if (session.user?.position) {
					return ['admin', 'manager', 'program_leader'].includes(session.user.position);
				}
				return false;
			}
		);
	}
}

export const lecturersService = new LecturerService();
