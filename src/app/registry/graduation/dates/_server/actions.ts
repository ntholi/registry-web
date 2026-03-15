'use server';

import type { graduationDates } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { graduationsService as service } from './service';

type Graduation = typeof graduationDates.$inferInsert;

export const getGraduationByDate = createAction(async (date: string) => {
	return service.getByDateWithTerm(date);
});

export const getLatestGraduationDate = createAction(async () => {
	return service.getLatest();
});

export const getAllGraduationDates = createAction(async () => {
	return service.getAllGraduationDates();
});

export const findAllGraduations = createAction(
	async (page: number = 1, search = '') => {
		return service.findAll({
			page,
			search,
			sort: [{ column: 'date', order: 'desc' }],
		});
	}
);

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
