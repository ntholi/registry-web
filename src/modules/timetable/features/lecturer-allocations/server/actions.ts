'use server';

import type { lecturerAllocations } from '@/core/database';
import { lecturerAllocationService as service } from './service';

type LecturerAllocation = typeof lecturerAllocations.$inferInsert;

export async function getLecturerAllocation(id: number) {
	return service.getWithRelations(id);
}

export async function getLecturerAllocationsByUserId(userId: string) {
	return service.getByUserIdWithRelations(userId);
}

export async function createLecturerAllocationsWithVenueTypes(
	allocations: LecturerAllocation[],
	venueTypeIds: number[]
) {
	return service.createManyWithVenueTypes(allocations, venueTypeIds);
}

export async function createLecturerAllocation(allocation: LecturerAllocation) {
	return service.create(allocation);
}

export async function createLecturerAllocationWithVenueTypes(
	allocation: LecturerAllocation,
	venueTypeIds: number[]
) {
	return service.createWithVenueTypes(allocation, venueTypeIds);
}

export async function updateLecturerAllocation(
	id: number,
	allocation: Partial<LecturerAllocation>
) {
	return service.update(id, allocation);
}

export async function updateLecturerAllocationVenueTypes(
	id: number,
	venueTypeIds: number[]
) {
	return service.updateVenueTypes(id, venueTypeIds);
}

export async function deleteLecturerAllocation(id: number) {
	return service.delete(id);
}
