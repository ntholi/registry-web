'use server';

import type { feedbackCategories } from '@/core/database';
import { feedbackCategoriesService as service } from './service';

type Category = typeof feedbackCategories.$inferInsert;

export async function getCategories(page = 1, search = '') {
	return service.findAll({
		page,
		search: search.trim(),
		searchColumns: ['name'],
	});
}

export async function getCategory(id: string) {
	return service.get(id);
}

export async function createCategory(data: Category) {
	return service.create(data);
}

export async function updateCategory(id: string, data: Category) {
	return service.update(id, data);
}

export async function deleteCategory(id: string) {
	return service.delete(id);
}

export async function getAllCategories() {
	return service.getAll();
}
