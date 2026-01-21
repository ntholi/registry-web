'use server';

import type { timetableAllocations } from '@/core/database';
import { timetableAllocationService as service } from './service';

type TimetableAllocation = typeof timetableAllocations.$inferInsert;

export async function getTimetableAllocationsByUserId(userId: string) {
	return service.getByUserIdWithRelations(userId);
}

export async function createTimetableAllocationsWithVenueTypes(
	allocations: TimetableAllocation[],
	venueTypeIds: string[],
	allowedVenueIds?: string[]
) {
	return service.createManyWithVenueTypes(
		allocations,
		venueTypeIds,
		allowedVenueIds ?? []
	);
}

export async function createTimetableAllocationWithVenueTypes(
	allocation: TimetableAllocation,
	venueTypeIds: string[],
	allowedVenueIds?: string[]
) {
	return service.createWithVenueTypes(
		allocation,
		venueTypeIds,
		allowedVenueIds ?? []
	);
}

export async function updateTimetableAllocation(
	id: number,
	allocation: Partial<TimetableAllocation>
) {
	return service.update(id, allocation);
}

export async function updateTimetableAllocationVenueTypes(
	id: number,
	venueTypeIds: string[]
) {
	return service.updateVenueTypes(id, venueTypeIds);
}

export async function updateTimetableAllocationAllowedVenues(
	id: number,
	venueIds: string[]
) {
	return service.updateAllowedVenues(id, venueIds);
}

export async function deleteTimetableAllocation(id: number) {
	return service.delete(id);
}

export async function deleteTimetableAllocations(ids: number[]) {
	return service.deleteMany(ids);
}
