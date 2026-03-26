'use server';

import { eq } from 'drizzle-orm';
import { users } from '@/core/database';
import { lecturersService as service } from './service';

export async function getLecturer(id: string) {
	return service.get(id);
}

export async function getLecturers(
	page: number = 1,
	search = '',
	schoolId?: string
) {
	return service.getAll(
		{
			page,
			search,
			searchColumns: ['name', 'email'],
			filter: eq(users.role, 'academic'),
		},
		schoolId ? Number(schoolId) : undefined
	);
}

export async function searchAllLecturers(search: string) {
	return service.searchWithSchools(search);
}
