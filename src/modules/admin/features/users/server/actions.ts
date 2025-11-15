'use server';

import { eq } from 'drizzle-orm';
import { db, users } from '@/core/database';
import { usersService as service } from './service';

type User = typeof users.$inferInsert;
type UserWithSchools = User & { schoolIds?: number[] };

export async function getUser(id: string) {
	return service.get(id);
}

export async function getUserSchools(userId?: string) {
	if (!userId) return;
	return service.getUserSchools(userId);
}

export async function findAllUsers(page: number = 1, search = '') {
	return service.findAll({ page, search, searchColumns: ['email', 'name'] });
}

export async function findAllByRole(
	page: number = 1,
	search = '',
	role?: User['role']
) {
	return service.findAll({
		page,
		search,
		searchColumns: ['email', 'name'],
		filter: role !== undefined ? eq(users.role, role) : undefined,
	});
}

export async function createUser(user: UserWithSchools) {
	return service.create(user);
}

export async function updateUser(id: string, user: UserWithSchools) {
	return service.update(id, user);
}

export async function updateUserSchools(userId: string, schoolIds: number[]) {
	return service.updateUserSchools(userId, schoolIds);
}

export async function deleteUser(id: string) {
	return service.delete(id);
}

export async function findAllSchools() {
	const result = await db.query.schools.findMany({
		orderBy: (schools) => [schools.name],
	});
	return { data: result };
}

export async function getUserSchoolIds(userId?: string) {
	if (!userId) return [];
	return service.getUserSchoolIds(userId);
}
