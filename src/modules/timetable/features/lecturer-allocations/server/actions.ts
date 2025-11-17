'use server';

import type { lecturerAllocations } from '@/core/database';
import { lecturerAllocationService as service } from './service';

type LecturerAllocation = typeof lecturerAllocations.$inferInsert;

export async function getLecturerAllocation(id: number) {
	return service.getWithRelations(id);
}

export async function getAllLecturerAllocations() {
	return service.getAllWithRelations();
}

export async function getLecturerAllocationsByUserAndTerm(
	userId: string,
	termId: number
) {
	return service.getByUserAndTerm(userId, termId);
}

export async function getLecturerAllocationsByUserId(userId: string) {
	return service.getByUserIdWithRelations(userId);
}

export async function getUniqueLecturers() {
	return service.getUniqueLecturers();
}

export async function getAllLecturersForList(page: number = 1, search = '') {
	const allLecturers = await service.getUniqueLecturers();

	const filteredLecturers = search
		? allLecturers.filter((lecturer) => {
				const searchLower = search.toLowerCase();
				const name = lecturer.user?.name?.toLowerCase() || '';
				const email = lecturer.user?.email?.toLowerCase() || '';
				return name.includes(searchLower) || email.includes(searchLower);
			})
		: allLecturers;

	const pageSize = 50;
	const totalPages = Math.ceil(filteredLecturers.length / pageSize);
	const startIndex = (page - 1) * pageSize;
	const endIndex = startIndex + pageSize;

	return {
		items: filteredLecturers.slice(startIndex, endIndex),
		totalPages,
		totalItems: filteredLecturers.length,
	};
}

export async function getLecturersByTerm(termId: number) {
	return service.getLecturersByTerm(termId);
}

export async function createLecturerAllocations(
	allocations: LecturerAllocation[]
) {
	return service.createMany(allocations);
}

export async function createLecturerAllocationsWithVenueTypes(
	allocations: LecturerAllocation[],
	venueTypeIds: number[]
) {
	return service.createManyWithVenueTypes(allocations, venueTypeIds);
}

export async function deleteLecturerAllocationsByUserAndTerm(
	userId: string,
	termId: number
) {
	return service.deleteByUserAndTerm(userId, termId);
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
