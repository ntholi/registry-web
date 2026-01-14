'use server';

import type { venueTypes } from '@/core/database';
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

export async function createVenueType(venueType: VenueType) {
	return service.create(venueType);
}

export async function updateVenueType(
	id: string,
	venueType: Partial<VenueType>
) {
	return service.update(id, venueType);
}

export async function deleteVenueType(id: string) {
	return service.delete(id);
}
