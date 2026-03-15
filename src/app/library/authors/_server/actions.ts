'use server';

import { sql } from 'drizzle-orm';
import { authors, db } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { authorsService } from './service';

type Author = typeof authors.$inferInsert;

export const getAuthor = createAction(async (id: string) => {
	return authorsService.get(id);
});

export const getOrCreateAuthors = createAction(async (names: string[]) => {
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
});

export const getAuthors = createAction(
	async (page: number = 1, search: string = '') => {
		return authorsService.findAll({
			page,
			search,
			searchColumns: ['name'],
			sort: [{ column: 'name', order: 'asc' }],
		});
	}
);

export const getAllAuthors = createAction(async () => {
	const result = await authorsService.findAll({ size: 1000 });
	return result.items;
});

export const createAuthor = createAction(async (data: Author) => {
	return authorsService.create(data);
});

export const updateAuthor = createAction(async (id: string, data: Author) => {
	return authorsService.update(id, data);
});

export const deleteAuthor = createAction(async (id: string) => {
	return authorsService.delete(id);
});
