'use server';

import { and, eq } from 'drizzle-orm';
import { lecturersService as service } from './service';
import { users } from '@/db/schema';

export async function getLecturer(id: string) {
  return service.get(id);
}

export async function getLecturers(page: number = 1, search = '') {
  return service.getAll({
    page,
    search,
    searchColumns: ['name', 'email'],
    filter: and(eq(users.role, 'academic'), eq(users.position, 'lecturer')),
  });
}
