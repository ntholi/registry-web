'use server';

import type { categories } from '@/core/database';
import { categoriesService } from './service';

type Category = typeof categories.$inferInsert;

export async function getCategory(id: number) {
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

export async function createCategory(data: Category) {
	return categoriesService.create(data);
}

export async function updateCategory(id: number, data: Category) {
	return categoriesService.update(id, data);
}

export async function deleteCategory(id: number) {
	return categoriesService.delete(id);
}
