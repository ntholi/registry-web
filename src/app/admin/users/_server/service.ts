import { eq } from 'drizzle-orm';
import { db, userSchools, type users } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import UserRepository from './repository';

type User = typeof users.$inferInsert;
type UserSelect = typeof users.$inferSelect;

type UserWithSchools = User & { schoolIds?: number[] };

class UserService {
	constructor(private readonly repository = new UserRepository()) {}

	async get(id: string) {
		return withAuth(async () => this.repository.findById(id), ['dashboard']);
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
		return withAuth(async () => {
			const { schoolIds, ...userData } = data;
			const user = await this.repository.create(userData);

			if (schoolIds && schoolIds.length > 0) {
				await this.updateUserSchools(user.id, schoolIds);
			}

			return user;
		}, []);
	}

	async update(id: string, data: UserWithSchools) {
		return withAuth(async () => {
			const { schoolIds, ...userData } = data;
			const user = await this.repository.update(id, userData);

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
		return withAuth(async () => {
			await db.delete(userSchools).where(eq(userSchools.userId, id));
			return this.repository.delete(id);
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
