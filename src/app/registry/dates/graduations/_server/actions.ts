'use server';

import type { graduations } from '@/core/database';
import { graduationsService as service } from './service';

type Graduation = typeof graduations.$inferInsert;

export async function getGraduationByDate(date: string) {
	return service.getByDateWithTerm(date);
}

export async function findAllGraduations(page: number = 1, search = '') {
	return service.findAll({
		page,
		search,
		sort: [{ column: 'graduationDate', order: 'desc' }],
	});
}

export async function createGraduation(graduation: Graduation) {
	return service.create(graduation);
}

export async function updateGraduation(id: number, graduation: Graduation) {
	return service.update(id, graduation);
}

export async function deleteGraduation(id: number) {
	return service.deleteGraduation(id);
}
