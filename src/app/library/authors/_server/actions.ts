'use server';

import { eq } from 'drizzle-orm';
import { authors, db } from '@/core/database';
import { authorsService } from './service';

type Author = typeof authors.$inferInsert;

export async function getAuthor(id: number) {
	return authorsService.get(id);
}

export async function getOrCreateAuthors(names: string[]) {
	if (names.length === 0) return [];
	return db.transaction(async (tx) => {
		const results: { id: number; name: string }[] = [];
		for (const name of names) {
			const trimmed = name.trim();
			if (!trimmed) continue;
			const [existing] = await tx
				.select()
				.from(authors)
				.where(eq(authors.name, trimmed))
				.limit(1);
			if (existing) {
				results.push(existing);
			} else {
				const [created] = await tx
					.insert(authors)
					.values({ name: trimmed })
					.returning();
				results.push(created);
			}
		}
		return results;
	});
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
