import { getUserSchoolIds } from '@admin/users';
import { default as UserRepository } from '@admin/users/_server/repository';
import type { users } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import { withPermission } from '@/core/platform/withPermission';

class LecturerService {
	constructor(private readonly repository = new UserRepository()) {}

	async get(id: string) {
		return withPermission(async () => this.repository.findById(id), {
			lecturers: ['read'],
		});
	}

	async getAll(params: QueryOptions<typeof users>) {
		return withPermission(
			async (session) => {
				const userSchools = await getUserSchoolIds(session?.user?.id);
				return this.repository.getBySchools(userSchools, params);
			},
			{ lecturers: ['read'] }
		);
	}

	async searchWithSchools(search: string) {
		return withPermission(
			async (session) => {
				const userSchools = await getUserSchoolIds(session?.user?.id);
				const results = await this.repository.searchLecturersWithSchools(
					search,
					20,
					userSchools
				);

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
			},
			{ lecturers: ['read'] }
		);
	}
}

export const lecturersService = serviceWrapper(
	LecturerService,
	'LecturerService'
);
