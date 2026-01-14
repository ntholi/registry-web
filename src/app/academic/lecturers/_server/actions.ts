'use server';

import { and, eq, ne } from 'drizzle-orm';
import { users } from '@/core/database';
import withAuth from '@/core/platform/withAuth';
import { lecturersService as service } from './service';

export async function getLecturer(id: string) {
	return service.get(id);
}

export async function getLecturers(page: number = 1, search = '') {
	return service.getAll({
		page,
		search,
		searchColumns: ['name', 'email'],
		filter: and(eq(users.role, 'academic'), ne(users.position, 'admin')),
	});
}

export async function searchAllLecturers(search: string) {
	return withAuth(
		async () => service.searchWithSchools(search),
		['academic', 'registry']
	);
}
