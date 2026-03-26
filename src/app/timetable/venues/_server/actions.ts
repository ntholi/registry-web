'use server';

import { eq } from 'drizzle-orm';
import { venues } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import type { VenueInsert } from './repository';
import { venueService as service } from './service';

type Venue = typeof venues.$inferInsert;

export async function getVenueWithRelations(id: string) {
	return service.getWithRelations(id);
}

export async function findAllVenues(page = 1, search = '', typeId?: string) {
	return service.findAllWithRelations({
		page,
		search,
		searchColumns: ['name'],
		sort: [{ column: 'name', order: 'asc' }],
		filter: typeId ? eq(venues.typeId, typeId) : undefined,
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
