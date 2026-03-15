'use server';

import type { venueTypes } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { venueTypeService as service } from './service';

type VenueType = typeof venueTypes.$inferInsert;

export const getVenueType = createAction(async (id: string) => {
	return service.get(id);
});

export const findAllVenueTypes = createAction(
	async (page: number = 1, search: string = '') => {
		return service.findAll({
			page,
			search,
			searchColumns: ['name'],
			sort: [{ column: 'name', order: 'asc' }],
		});
	}
);

export const getAllVenueTypes = createAction(async () => {
	return await service.getAll();
});

export const createVenueType = createAction(async (venueType: VenueType) => {
	return service.create(venueType);
});

export const updateVenueType = createAction(
	async (id: string, venueType: Partial<VenueType>) => {
		return service.update(id, venueType);
	}
);

export const deleteVenueType = createAction(async (id: string) => {
	return service.delete(id);
});
