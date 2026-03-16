'use server';

import { sql } from 'drizzle-orm';
import { categories, db } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { categoriesService } from './service';

type Category = typeof categories.$inferInsert;

export async function getCategory(id: string) {
	return categoriesService.get(id);
}

export async function getCategories(page = 1, search = '') {
	return categoriesService.findAll({
		page,
		search,
		searchColumns: ['name'],
		sort: [{ column: 'name', order: 'asc' }],
	});
}

export async function getAllCategories() {
	const result = await categoriesService.findAll({ size: 1000 });
	return result.items;
}

export async function getOrCreateCategories(names: string[]) {
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
}

export const createCategory = createAction(async (data: Category) =>
	categoriesService.create(data)
);

export const updateCategory = createAction(async (id: string, data: Category) =>
	categoriesService.update(id, data)
);

export const deleteCategory = createAction(async (id: string) =>
	categoriesService.delete(id)
);
