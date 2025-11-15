import { getUserSchoolIds, UserRepository } from '@admin/users/server';
import { auth } from '@/core/auth';
import type { users } from '@/core/database/schema';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';

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

export const lecturersService = serviceWrapper(
	LecturerService,
	'LecturerService'
);
