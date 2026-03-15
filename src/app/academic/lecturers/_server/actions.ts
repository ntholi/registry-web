'use server';

import { eq } from 'drizzle-orm';
import { users } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { lecturersService as service } from './service';

export const getLecturer = createAction(async (id: string) => service.get(id));

export const getLecturers = createAction(
	async (page: number = 1, search: string = '') =>
		service.getAll({
			page,
			search,
			searchColumns: ['name', 'email'],
			filter: eq(users.role, 'academic'),
		})
);

export const searchAllLecturers = createAction(async (search: string) =>
	service.searchWithSchools(search)
);
