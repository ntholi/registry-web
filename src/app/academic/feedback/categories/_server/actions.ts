'use server';

import type { feedbackCategories } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { feedbackCategoriesService as service } from './service';

type Category = typeof feedbackCategories.$inferInsert;

export const getCategories = createAction(async (page = 1, search = '') =>
	service.findAll({
		page,
		search: search.trim(),
		searchColumns: ['name'],
	})
);

export const getCategory = createAction(async (id: string) => service.get(id));

export const createCategory = createAction(async (data: Category) =>
	service.create(data)
);

export const updateCategory = createAction(async (id: string, data: Category) =>
	service.update(id, data)
);

export const deleteCategory = createAction(async (id: string) =>
	service.delete(id)
);

export const getAllCategories = createAction(async () => service.getAll());
