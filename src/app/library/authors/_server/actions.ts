'use server';

import type { authors } from '@/core/database';
import { authorsService } from './service';

type Author = typeof authors.$inferInsert;

export async function getAuthor(id: number) {
	return authorsService.get(id);
}

export async function getAuthors(page = 1, search = '') {
	return authorsService.findAll({
		page,
		search,
		searchColumns: ['name'],
		sort: [{ column: 'name', order: 'asc' }],
	});
}

export async function getAllAuthors() {
	const result = await authorsService.findAll({ size: 1000 });
	return result.items;
}

export async function createAuthor(data: Author) {
	return authorsService.create(data);
}

export async function updateAuthor(id: number, data: Author) {
	return authorsService.update(id, data);
}

export async function deleteAuthor(id: number) {
	return authorsService.delete(id);
}
