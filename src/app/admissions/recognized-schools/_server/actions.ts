'use server';

import type { recognizedSchools } from '@/core/database';
import { recognizedSchoolsService } from './service';

type RecognizedSchool = typeof recognizedSchools.$inferInsert;

export async function getRecognizedSchool(id: number) {
	return recognizedSchoolsService.get(id);
}

export async function findAllRecognizedSchools(page = 1, search = '') {
	return recognizedSchoolsService.findAll({
		page,
		search,
		sort: [{ column: 'createdAt', order: 'desc' }],
	});
}

export async function createRecognizedSchool(data: RecognizedSchool) {
	return recognizedSchoolsService.create(data);
}

export async function updateRecognizedSchool(
	id: number,
	data: RecognizedSchool
) {
	return recognizedSchoolsService.update(id, data);
}

export async function deleteRecognizedSchool(id: number) {
	return recognizedSchoolsService.delete(id);
}

export async function findRecognizedSchoolsForEligibility() {
	return recognizedSchoolsService.findAllForEligibility();
}
