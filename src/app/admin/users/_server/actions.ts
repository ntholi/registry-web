'use server';

import { and, eq, type SQL } from 'drizzle-orm';
import { users } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { usersService as service } from './service';

type User = typeof users.$inferInsert;
type UserSelect = typeof users.$inferSelect;
type UserWithSchools = User & {
	schoolIds?: number[];
	lmsUserId?: number | null;
	lmsToken?: string | null;
};

export async function getUser(id: string) {
	return service.get(id);
}

export async function getUserSchools(userId?: string) {
	if (!userId) return;
	return service.getUserSchools(userId);
}

export async function findAllUsers(
	page: number = 1,
	search = '',
	role?: string,
	presetId?: string
) {
	const conditions: SQL[] = [];
	if (role)
		conditions.push(eq(users.role, role as typeof users.$inferSelect.role));
	if (presetId) conditions.push(eq(users.presetId, presetId));

	return service.findAll({
		page,
		search,
		searchColumns: ['email', 'name'],
		filter: conditions.length ? and(...conditions) : undefined,
	});
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

export async function findAllByRoles(roles: NonNullable<UserSelect['role']>[]) {
	return service.findAllByRoles(roles);
}

export const createUser = createAction(async (user: UserWithSchools) =>
	service.create(user)
);

export const updateUser = createAction(
	async (id: string, user: UserWithSchools) => service.update(id, user)
);

export const deleteUser = createAction(async (id: string) =>
	service.delete(id)
);

export async function getUserSchoolIds(userId?: string) {
	if (!userId) return [];
	return service.getUserSchoolIds(userId);
}
