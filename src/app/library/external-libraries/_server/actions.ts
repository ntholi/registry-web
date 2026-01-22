'use server';

import type { externalLibraries } from '@/core/database';
import { externalLibrariesService } from './service';

type ExternalLibraryInsert = typeof externalLibraries.$inferInsert;

export async function getExternalLibrary(id: string) {
	return externalLibrariesService.get(id);
}

export async function getExternalLibraries(page = 1, search = '') {
	return externalLibrariesService.findAll({
		page,
		search,
		searchColumns: ['name', 'description'],
	});
}

export async function getAllExternalLibraries() {
	return externalLibrariesService.getAll();
}

export async function createExternalLibrary(data: ExternalLibraryInsert) {
	return externalLibrariesService.create(data);
}

export async function updateExternalLibrary(
	id: string,
	data: Partial<ExternalLibraryInsert>
) {
	return externalLibrariesService.update(id, data);
}

export async function deleteExternalLibrary(id: string) {
	return externalLibrariesService.delete(id);
}
