'use server';

import type { recognizedSchools } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { recognizedSchoolsService } from './service';

type RecognizedSchool = typeof recognizedSchools.$inferInsert;

export async function getRecognizedSchool(id: string) {
	return recognizedSchoolsService.get(id);
}

export async function findAllRecognizedSchools(page = 1, search = '') {
	return recognizedSchoolsService.findAll({
		page,
		search,
		sort: [{ column: 'createdAt', order: 'desc' }],
	});
}

export const createRecognizedSchool = createAction(
	async (data: RecognizedSchool) => recognizedSchoolsService.create(data)
);

export const updateRecognizedSchool = createAction(
	async (id: string, data: RecognizedSchool) =>
		recognizedSchoolsService.update(id, data)
);

export const deleteRecognizedSchool = createAction(async (id: string) =>
	recognizedSchoolsService.delete(id)
);

export async function findRecognizedSchoolsForEligibility() {
	return recognizedSchoolsService.findAllForEligibility();
}
