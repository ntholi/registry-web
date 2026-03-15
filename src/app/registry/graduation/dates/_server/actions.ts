'use server';

import type { graduationDates } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { graduationsService as service } from './service';

type Graduation = typeof graduationDates.$inferInsert;

export const getGraduationByDate = createAction(async (date: string) =>
	service.getByDateWithTerm(date)
);

export const getLatestGraduationDate = createAction(async () =>
	service.getLatest()
);

export const getAllGraduationDates = createAction(async () =>
	service.getAllGraduationDates()
);

export const findAllGraduations = createAction(
	async (page: number = 1, search: string = '') =>
		service.findAll({
			page,
			search,
			sort: [{ column: 'date' as const, order: 'desc' }],
		})
);

export const createGraduation = createAction(async (graduation: Graduation) =>
	service.create(graduation)
);

export const updateGraduation = createAction(
	async (id: number, graduation: Graduation) => service.update(id, graduation)
);

export const deleteGraduation = createAction(async (id: number) =>
	service.deleteGraduation(id)
);
