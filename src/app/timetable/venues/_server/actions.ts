'use server';

import type { venues } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import type { VenueInsert } from './repository';
import { venueService as service } from './service';

type Venue = typeof venues.$inferInsert;

export async function getVenueWithRelations(id: string) {
	return service.getWithRelations(id);
}

export async function findAllVenues(page = 1, search = '') {
	return service.findAllWithRelations({
		page,
		search,
		searchColumns: ['name'],
		sort: [{ column: 'name', order: 'asc' }],
	});
}

export async function getAllVenues() {
	return service.getAllWithRelations();
}

export const createVenue = createAction(
	async (venue: VenueInsert, schoolIds: number[]) =>
		service.createWithSchools(venue, schoolIds)
);

export const updateVenue = createAction(
	async (id: string, venue: Partial<Venue>, schoolIds?: number[]) =>
		service.updateWithSchools(id, venue, schoolIds)
);

export const deleteVenue = createAction(async (id: string) =>
	service.delete(id)
);
