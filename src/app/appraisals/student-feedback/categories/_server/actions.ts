'use server';

import type { studentFeedbackCategories } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { studentFeedbackCategoriesService as service } from './service';

type Category = typeof studentFeedbackCategories.$inferInsert;

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

export const createCategory = createAction(async (data: Category) =>
	service.create(data)
);

export const updateCategory = createAction(async (id: string, data: Category) =>
	service.update(id, data)
);

export const deleteCategory = createAction(async (id: string) =>
	service.delete(id)
);

export async function getAllCategories() {
	return service.getAll();
}
