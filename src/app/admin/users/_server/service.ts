import { eq } from 'drizzle-orm';
import { db, userSchools, type users } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withPermission';
import UserRepository from './repository';

type User = typeof users.$inferInsert;
type UserSelect = typeof users.$inferSelect;

type UserWithSchools = User & {
	schoolIds?: number[];
	lmsUserId?: number | null;
	lmsToken?: string | null;
};

class UserService {
	constructor(private readonly repository = new UserRepository()) {}

	async get(id: string) {
		return withAuth(async () => {
			const user = await this.repository.findById(id);
			if (!user) return user;

			const creds = await this.repository.getLmsCredentials(id);
			return {
				...user,
				lmsUserId: creds?.lmsUserId ?? null,
				lmsToken: creds?.lmsToken ?? null,
			};
		}, ['dashboard']);
	}

	async findAll(params: QueryOptions<typeof users>) {
		return withAuth(async () => this.repository.query(params), ['dashboard']);
	}

	async getUserSchoolIds(userId: string) {
		return withAuth(
			async () => this.repository.getUserSchoolIds(userId),
			['dashboard']
		);
	}

	async getUserSchools(userId: string) {
		return withAuth(async () => {
			return this.repository.getUserSchools(userId);
		}, ['dashboard']);
	}

	async create(data: UserWithSchools) {
		return withAuth(async (session) => {
			const { schoolIds, lmsUserId, lmsToken, ...userData } = data;
			const user = await this.repository.create(userData, {
				userId: session!.user!.id!,
				role: session!.user!.role!,
				activityType: 'user_created',
			});

			await this.repository.upsertLmsCredentials(user.id, lmsUserId, lmsToken);

			if (schoolIds && schoolIds.length > 0) {
				await this.updateUserSchools(user.id, schoolIds);
			}

			return user;
		}, []);
	}

	async update(id: string, data: UserWithSchools) {
		return withAuth(async (session) => {
			const { schoolIds, lmsUserId, lmsToken, ...userData } = data;
			const user = await this.repository.update(id, userData, {
				userId: session!.user!.id!,
				role: session!.user!.role!,
				activityType: 'user_updated',
			});

			await this.repository.upsertLmsCredentials(id, lmsUserId, lmsToken);

			if (schoolIds) {
				await this.updateUserSchools(id, schoolIds);
			}

			return user;
		}, []);
	}

	async updateUserSchools(userId: string, schoolIds: number[]) {
		return withAuth(async () => {
			await db.delete(userSchools).where(eq(userSchools.userId, userId));

			if (schoolIds.length > 0) {
				const userSchoolsData = schoolIds.map((schoolId) => ({
					userId,
					schoolId,
				}));

				await db.insert(userSchools).values(userSchoolsData);
			}
		}, []);
	}

	async delete(id: string) {
		return withAuth(async (session) => {
			await db.delete(userSchools).where(eq(userSchools.userId, id));
			return this.repository.delete(id, {
				userId: session!.user!.id!,
				role: session!.user!.role!,
				activityType: 'user_deleted',
			});
		}, []);
	}

	async findAllByRoles(roles: NonNullable<UserSelect['role']>[]) {
		return withAuth(
			async () => this.repository.findAllByRoles(roles),
			['dashboard']
		);
	}
}

export const usersService = serviceWrapper(UserService, 'UsersService');
