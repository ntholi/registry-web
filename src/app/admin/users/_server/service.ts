import {
	getLmsCredentials,
	upsertLmsCredentials,
} from '@auth/auth-providers/_server/repository';
import type { users } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
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
		return withPermission(
			async () => {
				const user = await this.repository.findById(id);
				if (!user) return user;

				const creds = await getLmsCredentials(id);
				return {
					...user,
					lmsUserId: creds?.lmsUserId ?? null,
					lmsToken: creds?.lmsToken ?? null,
				};
			},
			{ users: ['read'] }
		);
	}

	async findAll(params: QueryOptions<typeof users>) {
		return withPermission(async () => this.repository.query(params), {
			users: ['read'],
		});
	}

	async getUserSchoolIds(userId: string) {
		return withPermission(
			async () => this.repository.getUserSchoolIds(userId),
			{ users: ['read'] }
		);
	}

	async getUserSchools(userId: string) {
		return withPermission(
			async () => {
				return this.repository.getUserSchools(userId);
			},
			{ users: ['read'] }
		);
	}

	async create(data: UserWithSchools) {
		return withPermission(
			async (session) => {
				const { schoolIds, lmsUserId, lmsToken, ...userData } = data;
				const user = await this.repository.create(userData, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'user_created',
				});

				await upsertLmsCredentials(user.id, lmsUserId, lmsToken);

				if (schoolIds && schoolIds.length > 0) {
					await this.syncUserSchools(user.id, schoolIds);
				}

				return user;
			},
			{ users: ['create'] }
		);
	}

	async update(id: string, data: UserWithSchools) {
		return withPermission(
			async (session) => {
				const { schoolIds, lmsUserId, lmsToken, ...userData } = data;
				const user = await this.repository.update(id, userData, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'user_updated',
				});

				await upsertLmsCredentials(id, lmsUserId, lmsToken);

				if (schoolIds) {
					await this.syncUserSchools(id, schoolIds);
				}

				return user;
			},
			{ users: ['update'] }
		);
	}

	private async syncUserSchools(userId: string, schoolIds: number[]) {
		await this.repository.replaceUserSchools(userId, schoolIds);
	}

	async delete(id: string) {
		return withPermission(
			async (session) => {
				await this.repository.replaceUserSchools(id, []);
				return this.repository.delete(id, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'user_deleted',
				});
			},
			{ users: ['delete'] }
		);
	}

	async findAllByRoles(roles: NonNullable<UserSelect['role']>[]) {
		return withPermission(async () => this.repository.findAllByRoles(roles), {
			users: ['read'],
		});
	}
}

export const usersService = serviceWrapper(UserService, 'UsersService');
