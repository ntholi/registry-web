'use server';

import type { externalLibraries } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { externalLibrariesService } from './service';

type ExternalLibraryInsert = typeof externalLibraries.$inferInsert;

export const getExternalLibrary = createAction(async (id: string) => {
	return externalLibrariesService.get(id);
});

export const getExternalLibraries = createAction(
	async (page: number = 1, search: string = '') => {
		return externalLibrariesService.findAll({
			page,
			search,
			searchColumns: ['name', 'description'],
		});
	}
);

export const getAllExternalLibraries = createAction(async () => {
	return externalLibrariesService.getAll();
});

export const createExternalLibrary = createAction(
	async (data: ExternalLibraryInsert) => {
		return externalLibrariesService.create(data);
	}
);

export const updateExternalLibrary = createAction(
	async (id: string, data: Partial<ExternalLibraryInsert>) => {
		return externalLibrariesService.update(id, data);
	}
);

export const deleteExternalLibrary = createAction(async (id: string) => {
	return externalLibrariesService.delete(id);
});
