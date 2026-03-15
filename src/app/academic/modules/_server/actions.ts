'use server';

import type { modules } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { modulesService as service } from './service';

type Module = typeof modules.$inferInsert;

export const getModule = createAction(async (id: number) => service.get(id));

export const getModules = createAction(
	async (page: number = 1, search: string = '') =>
		service.findAll({
			page,
			search: search.trim(),
			searchColumns: ['code', 'name'],
		})
);

export const createModule = createAction(async (module: Module) =>
	service.create(module)
);

export const updateModule = createAction(async (id: number, module: Module) =>
	service.update(id, module)
);
