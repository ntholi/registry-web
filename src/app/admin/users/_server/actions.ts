'use server';

import { eq } from 'drizzle-orm';
import { users } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { usersService as service } from './service';

type User = typeof users.$inferInsert;
type UserSelect = typeof users.$inferSelect;
type UserWithSchools = User & {
	schoolIds?: number[];
	lmsUserId?: number | null;
	lmsToken?: string | null;
};

export const getUser = createAction(async (id: string) => {
	return service.get(id);
});

export const getUserSchools = createAction(async (userId?: string) => {
	if (!userId) return;
	return service.getUserSchools(userId);
});

export const findAllUsers = createAction(
	async (page: number = 1, search: string = '') => {
		return service.findAll({ page, search, searchColumns: ['email', 'name'] });
	}
);

export const findAllByRole = createAction(
	async (page: number = 1, search: string = '', role?: User['role']) => {
		return service.findAll({
			page,
			search,
			searchColumns: ['email', 'name'],
			filter: role !== undefined ? eq(users.role, role) : undefined,
		});
	}
);

export const findAllByRoles = createAction(
	async (roles: NonNullable<UserSelect['role']>[]) => {
		return service.findAllByRoles(roles);
	}
);

export const createUser = createAction(async (user: UserWithSchools) => {
	return service.create(user);
});

export const updateUser = createAction(
	async (id: string, user: UserWithSchools) => {
		return service.update(id, user);
	}
);

export const deleteUser = createAction(async (id: string) => {
	return service.delete(id);
});

export const getUserSchoolIds = createAction(async (userId?: string) => {
	if (!userId) return [];
	return service.getUserSchoolIds(userId);
});
