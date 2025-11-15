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

export async function getLecturersByTerm(termId: number) {
	return service.getLecturersByTerm(termId);
}

export async function createLecturerAllocations(
	allocations: LecturerAllocation[]
) {
	return service.createMany(allocations);
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

export async function updateLecturerAllocation(
	id: number,
	allocation: Partial<LecturerAllocation>
) {
	return service.update(id, allocation);
}

export async function deleteLecturerAllocation(id: number) {
	return service.delete(id);
}
