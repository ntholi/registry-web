import { auth } from '@/auth';
import type { users } from '@/db/schema';
import withAuth from '@/server/base/withAuth';
import { getUserSchoolIds } from '../../admin/users/actions';
import UserRepository from '../../admin/users/repository';
import type { QueryOptions } from '../../base/BaseRepository';

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
			async (session) => {
				if (session.user?.role === 'academic') {
					if (session.user?.position) {
						return ['admin', 'manager', 'program_leader'].includes(
							session.user.position
						);
					}
					return false;
				}
				return false;
			}
		);
	}
}

export const lecturersService = new LecturerService();
