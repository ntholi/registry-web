'use server';

import type { modules } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { modulesService as service } from './service';

type Module = typeof modules.$inferInsert;

export async function getModule(id: number) {
	return service.get(id);
}

export async function getModules(page: number = 1, search = '') {
	return service.findAll({
		page,
		search: search.trim(),
		searchColumns: ['code', 'name'],
	});
}

export const createModule = createAction(async (module: Module) =>
	service.create(module)
);

export const updateModule = createAction(async (id: number, module: Module) =>
	service.update(id, module)
);
