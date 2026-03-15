'use server';

import { sql } from 'drizzle-orm';
import { categories, db } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { categoriesService } from './service';

type Category = typeof categories.$inferInsert;

export const getCategory = createAction(async (id: string) => {
	return categoriesService.get(id);
});

export const getCategories = createAction(
	async (page: number = 1, search: string = '') => {
		return categoriesService.findAll({
			page,
			search,
			searchColumns: ['name'],
			sort: [{ column: 'name', order: 'asc' }],
		});
	}
);

export const getAllCategories = createAction(async () => {
	const result = await categoriesService.findAll({ size: 1000 });
	return result.items;
});

export const getOrCreateCategories = createAction(async (names: string[]) => {
	if (names.length === 0) return [];
	return db.transaction(async (tx) => {
		const results: { id: string; name: string }[] = [];
		for (const name of names) {
			const trimmed = name.trim();
			if (!trimmed) continue;
			const [existing] = await tx
				.select()
				.from(categories)
				.where(sql`lower(${categories.name}) = lower(${trimmed})`)
				.limit(1);
			if (existing) {
				results.push(existing);
			} else {
				const [created] = await tx
					.insert(categories)
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

export const createCategory = createAction(async (data: Category) => {
	return categoriesService.create(data);
});

export const updateCategory = createAction(
	async (id: string, data: Category) => {
		return categoriesService.update(id, data);
	}
);

export const deleteCategory = createAction(async (id: string) => {
	return categoriesService.delete(id);
});
