'use server';

import type { graduationDates } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { graduationsService as service } from './service';

type Graduation = typeof graduationDates.$inferInsert;

export async function getGraduationByDate(date: string) {
	return service.getByDateWithTerm(date);
}

export async function getLatestGraduationDate() {
	return service.getLatest();
}

export async function getAllGraduationDates() {
	return service.getAllGraduationDates();
}

export async function findAllGraduations(page: number = 1, search = '') {
	return service.findAll({
		page,
		search,
		sort: [{ column: 'date', order: 'desc' }],
	});
}

export const createGraduation = createAction(async (graduation: Graduation) => {
	return service.create(graduation);
});

export const updateGraduation = createAction(
	async (id: number, graduation: Graduation) => {
		return service.update(id, graduation);
	}
);

export const deleteGraduation = createAction(async (id: number) => {
	return service.deleteGraduation(id);
});
