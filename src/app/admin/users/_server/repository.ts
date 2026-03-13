import { and, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';
import {
	db,
	lmsCredentials,
	permissionPresets,
	userSchools,
	users,
} from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import BaseRepository from '@/core/platform/BaseRepository';

type UserPreset = {
	id: string;
	name: string;
	role: NonNullable<(typeof permissionPresets.$inferSelect)['role']>;
	description: (typeof permissionPresets.$inferSelect)['description'];
};

export type UserDetail = typeof users.$inferSelect & {
	preset: UserPreset | null;
	schoolIds: number[];
	lmsUserId: number | null;
	lmsToken: string | null;
};

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

	async getDetail(userId: string): Promise<UserDetail | null> {
		const [row] = await db
			.select({
				user: users,
				preset: {
					id: permissionPresets.id,
					name: permissionPresets.name,
					role: permissionPresets.role,
					description: permissionPresets.description,
				},
				lmsUserId: lmsCredentials.lmsUserId,
				lmsToken: lmsCredentials.lmsToken,
				schoolIds: sql<
					number[]
				>`coalesce(array_remove(array_agg(distinct ${userSchools.schoolId}), null), '{}')`,
			})
			.from(users)
			.leftJoin(permissionPresets, eq(users.presetId, permissionPresets.id))
			.leftJoin(lmsCredentials, eq(users.id, lmsCredentials.userId))
			.leftJoin(userSchools, eq(users.id, userSchools.userId))
			.where(eq(users.id, userId))
			.groupBy(users.id, permissionPresets.id, lmsCredentials.id);

		if (!row) {
			return null;
		}

		return {
			...row.user,
			preset: row.preset?.id ? row.preset : null,
			schoolIds: row.schoolIds ?? [],
			lmsUserId: row.lmsUserId ?? null,
			lmsToken: row.lmsToken ?? null,
		};
	}

	async replaceUserSchools(userId: string, schoolIds: number[]) {
		return db.transaction(async (tx) => {
			await tx.delete(userSchools).where(eq(userSchools.userId, userId));

			if (schoolIds.length === 0) {
				return;
			}

			await tx.insert(userSchools).values(
				schoolIds.map((schoolId) => ({
					userId,
					schoolId,
				}))
			);
		});
	}

	async findAllByRoles(roles: (typeof users.$inferSelect)['role'][]) {
		return db.select().from(users).where(inArray(users.role, roles));
	}

	async searchLecturersWithSchools(
		search: string,
		limit = 20,
		schoolIds?: number[]
	) {
		const schoolFilter =
			schoolIds && schoolIds.length > 0
				? inArray(
						users.id,
						db
							.select({ userId: userSchools.userId })
							.from(userSchools)
							.where(inArray(userSchools.schoolId, schoolIds))
					)
				: undefined;

		return db.query.users.findMany({
			where: and(
				eq(users.role, 'academic'),
				ne(users.position, 'admin'),
				or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)),
				schoolFilter
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
