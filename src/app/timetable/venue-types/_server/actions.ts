'use server';

import type { venueTypes } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { venueTypeService as service } from './service';

type VenueType = typeof venueTypes.$inferInsert;

export async function getVenueType(id: string) {
	return service.get(id);
}

export async function findAllVenueTypes(page: number = 1, search = '') {
	return service.findAll({
		page,
		search,
		searchColumns: ['name'],
		sort: [{ column: 'name', order: 'asc' }],
	});
}

export async function getAllVenueTypes() {
	return await service.getAll();
}

export const createVenueType = createAction(async (venueType: VenueType) =>
	service.create(venueType)
);

export const updateVenueType = createAction(
	async (id: string, venueType: Partial<VenueType>) =>
		service.update(id, venueType)
);

export const deleteVenueType = createAction(async (id: string) =>
	service.delete(id)
);
