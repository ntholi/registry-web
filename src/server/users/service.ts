import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { userSchools, type users } from '@/db/schema';
import { serviceWrapper } from '@/server/base/serviceWrapper';
import withAuth from '@/server/base/withAuth';
import type { QueryOptions } from '../base/BaseRepository';
import UserRepository from './repository';

type User = typeof users.$inferInsert;

type UserWithSchools = User & { schoolIds?: number[] };

class UserService {
	constructor(private readonly repository = new UserRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

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

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}
}

export const usersService = serviceWrapper(UserService, 'UsersService');
