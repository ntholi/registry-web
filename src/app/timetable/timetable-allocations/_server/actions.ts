'use server';

import type { timetableAllocations } from '@/core/database';
import { timetableAllocationService as service } from './service';

type TimetableAllocation = typeof timetableAllocations.$inferInsert;

export async function getTimetableAllocation(id: number) {
	return service.getWithRelations(id);
}

export async function getTimetableAllocationsByUserId(userId: string) {
	return service.getByUserIdWithRelations(userId);
}

export async function createTimetableAllocationsWithVenueTypes(
	allocations: TimetableAllocation[],
	venueTypeIds: number[]
) {
	return service.createManyWithVenueTypes(allocations, venueTypeIds);
}

export async function createTimetableAllocation(
	allocation: TimetableAllocation
) {
	return service.create(allocation);
}

export async function createTimetableAllocationWithVenueTypes(
	allocation: TimetableAllocation,
	venueTypeIds: number[]
) {
	return service.createWithVenueTypes(allocation, venueTypeIds);
}

export async function updateTimetableAllocation(
	id: number,
	allocation: Partial<TimetableAllocation>
) {
	return service.update(id, allocation);
}

export async function updateTimetableAllocationVenueTypes(
	id: number,
	venueTypeIds: number[]
) {
	return service.updateVenueTypes(id, venueTypeIds);
}

export async function deleteTimetableAllocation(id: number) {
	return service.delete(id);
}
