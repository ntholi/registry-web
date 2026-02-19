import { and, eq, ilike, inArray, ne, or } from 'drizzle-orm';
import { db, userSchools, users } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import BaseRepository from '@/core/platform/BaseRepository';

export default class UserRepository extends BaseRepository<typeof users, 'id'> {
	constructor() {
		super(users, users.id);
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

	async findAllByRoles(roles: (typeof users.$inferSelect)['role'][]) {
		return db.select().from(users).where(inArray(users.role, roles));
	}

	async updateUserLmsUserId(userId: string, lmsUserId: number) {
		return db.update(users).set({ lmsUserId }).where(eq(users.id, userId));
	}

	async searchLecturersWithSchools(search: string, limit = 20) {
		return db.query.users.findMany({
			where: and(
				eq(users.role, 'academic'),
				ne(users.position, 'admin'),
				or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
			),
			with: {
				userSchools: {
					with: {
						school: {
							columns: { code: true },
						},
					},
				},
			},
			limit,
		});
	}
}

export const usersRepository = new UserRepository();
