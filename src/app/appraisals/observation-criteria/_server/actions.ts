'use server';

import type {
	observationCategories,
	observationCriteria,
} from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { observationCriteriaService as service } from './service';

type Category = typeof observationCategories.$inferInsert;
type Criterion = typeof observationCriteria.$inferInsert;

export async function getCategoriesWithCriteria() {
	return service.getCategoriesWithCriteria();
}

export async function getCategory(id: string) {
	return service.get(id);
}

export const createCategory = createAction(async (data: Category) =>
	service.create(data)
);

export const updateCategory = createAction(
	async (id: string, data: Partial<Category>) => service.update(id, data)
);

export const deleteCategory = createAction(async (id: string) =>
	service.delete(id)
);

export const createCriterion = createAction(async (data: Criterion) =>
	service.createCriterion(data)
);

export const updateCriterion = createAction(
	async (id: string, data: Partial<Criterion>) =>
		service.updateCriterion(id, data)
);

export const deleteCriterion = createAction(async (id: string) =>
	service.deleteCriterion(id)
);

export const reorderCategories = createAction(async (ids: string[]) =>
	service.reorderCategories(ids)
);

export const reorderCriteria = createAction(async (orderedIds: string[]) =>
	service.reorderCriteria(orderedIds)
);
