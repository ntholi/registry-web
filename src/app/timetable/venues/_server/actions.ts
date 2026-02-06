'use server';

import type { venues } from '@/core/database';
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

export async function createVenue(venue: VenueInsert, schoolIds: number[]) {
	return service.createWithSchools(venue, schoolIds);
}

export async function updateVenue(
	id: string,
	venue: Partial<Venue>,
	schoolIds?: number[]
) {
	return service.updateWithSchools(id, venue, schoolIds);
}

export async function deleteVenue(id: string) {
	return service.delete(id);
}
