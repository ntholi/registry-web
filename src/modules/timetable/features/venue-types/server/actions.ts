'use server';

import type { venueTypes } from '@/core/database';
import { venueTypeService as service } from './service';

type VenueType = typeof venueTypes.$inferInsert;

export async function getVenueType(id: number) {
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
	return service.getAll();
}

export async function createVenueType(venueType: VenueType) {
	return service.create(venueType);
}

export async function updateVenueType(
	id: number,
	venueType: Partial<VenueType>
) {
	return service.update(id, venueType);
}

export async function deleteVenueType(id: number) {
	return service.delete(id);
}
