import { authProviderService } from '@auth/auth-providers/_server/service';
import { authUsersService } from '@auth/users/_server/service';
import { hasPermission } from '@/core/auth/permissions';
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
		return withPermission(async () => this.repository.getDetail(id), {
			users: ['read'],
		});
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
			async (session) =>
				session.user.id === userId ||
				hasPermission(session.permissions ?? [], { users: ['read'] })
		);
	}

	async create(data: UserWithSchools) {
		return withPermission(
			async (session) => {
				const { schoolIds, lmsUserId, lmsToken, presetId, ...userData } = data;
				const user = await this.repository.create(userData, {
					userId: session!.user!.id!,
					role: session!.user!.role!,
					activityType: 'user_created',
				});

				if (Object.hasOwn(data, 'presetId')) {
					await authUsersService.assignPreset(user.id, presetId);
				}

				await authProviderService.syncLmsCredentials(
					user.id,
					lmsUserId,
					lmsToken
				);

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
				const hasPresetId = Object.hasOwn(data, 'presetId');
				const { schoolIds, lmsUserId, lmsToken, presetId, ...userData } = data;
				const hasUserChanges = Object.keys(userData).length > 0;
				const user = hasUserChanges
					? await this.repository.update(id, userData, {
							userId: session!.user!.id!,
							role: session!.user!.role!,
							activityType: 'user_updated',
						})
					: await this.repository.findById(id);

				if (!user) {
					throw new Error('User not found');
				}

				if (hasPresetId) {
					await authUsersService.assignPreset(id, presetId);
				}

				await authProviderService.syncLmsCredentials(id, lmsUserId, lmsToken);

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
