'use server';

import type { recognizedSchools } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { recognizedSchoolsService } from './service';

type RecognizedSchool = typeof recognizedSchools.$inferInsert;

export const getRecognizedSchool = createAction(async (id: string) => {
	return recognizedSchoolsService.get(id);
});

export const findAllRecognizedSchools = createAction(
	async (page: number = 1, search: string = '') => {
		return recognizedSchoolsService.findAll({
			page,
			search,
			sort: [{ column: 'createdAt', order: 'desc' }],
		});
	}
);

export const createRecognizedSchool = createAction(
	async (data: RecognizedSchool) => {
		return recognizedSchoolsService.create(data);
	}
);

export const updateRecognizedSchool = createAction(
	async (id: string, data: RecognizedSchool) => {
		return recognizedSchoolsService.update(id, data);
	}
);

export const deleteRecognizedSchool = createAction(async (id: string) => {
	return recognizedSchoolsService.delete(id);
});

export const findRecognizedSchoolsForEligibility = createAction(async () => {
	return recognizedSchoolsService.findAllForEligibility();
});
