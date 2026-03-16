'use server';

import { sql } from 'drizzle-orm';
import { authors, db } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { authorsService } from './service';

type Author = typeof authors.$inferInsert;

export async function getAuthor(id: string) {
	return authorsService.get(id);
}

export async function getOrCreateAuthors(names: string[]) {
	if (names.length === 0) return [];
	return db.transaction(async (tx) => {
		const results: { id: string; name: string }[] = [];
		for (const name of names) {
			const trimmed = name.trim();
			if (!trimmed) continue;
			const [existing] = await tx
				.select()
				.from(authors)
				.where(sql`lower(${authors.name}) = lower(${trimmed})`)
				.limit(1);
			if (existing) {
				results.push(existing);
			} else {
				const [created] = await tx
					.insert(authors)
					.values({ name: trimmed })
					.returning();
				if (created) {
					results.push(created);
				}
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

export const createAuthor = createAction(async (data: Author) =>
	authorsService.create(data)
);

export const updateAuthor = createAction(async (id: string, data: Author) =>
	authorsService.update(id, data)
);

export const deleteAuthor = createAction(async (id: string) =>
	authorsService.delete(id)
);
