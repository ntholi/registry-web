import { getUserSchoolIds } from '@admin/users';
import { default as UserRepository } from '@admin/users/_server/repository';
import { auth } from '@/core/auth';
import type { users } from '@/core/database';
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

	async searchWithSchools(search: string) {
		const results = await this.repository.searchLecturersWithSchools(search);
		return results.map((l) => {
			const schoolCodes = l.userSchools
				.map((us) => us.school.code)
				.filter(Boolean)
				.join(', ');
			const name = l.name ?? l.email ?? l.id;
			return {
				value: l.id,
				label: schoolCodes ? `${name} (${schoolCodes})` : name,
			};
		});
	}
}

export const lecturersService = serviceWrapper(
	LecturerService,
	'LecturerService'
);
