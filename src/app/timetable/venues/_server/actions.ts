'use server';

import type { venues } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import type { VenueInsert } from './repository';
import { venueService as service } from './service';

type Venue = typeof venues.$inferInsert;

export const getVenueWithRelations = createAction(async (id: string) => {
	return service.getWithRelations(id);
});

export const findAllVenues = createAction(
	async (page: number = 1, search: string = '') => {
		return service.findAllWithRelations({
			page,
			search,
			searchColumns: ['name'],
			sort: [{ column: 'name', order: 'asc' }],
		});
	}
);

export const getAllVenues = createAction(async () => {
	return service.getAllWithRelations();
});

export const createVenue = createAction(
	async (venue: VenueInsert, schoolIds: number[]) => {
		return service.createWithSchools(venue, schoolIds);
	}
);

export const updateVenue = createAction(
	async (id: string, venue: Partial<Venue>, schoolIds?: number[]) => {
		return service.updateWithSchools(id, venue, schoolIds);
	}
);

export const deleteVenue = createAction(async (id: string) => {
	return service.delete(id);
});
