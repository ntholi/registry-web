'use server';

import type { timetableAllocations } from '@/core/database';
import { TimetablePlanningError } from '../../slots/_server/errors';
import { timetableAllocationService as service } from './service';

type TimetableAllocation = typeof timetableAllocations.$inferInsert;

export type ActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

function extractErrorMessage(error: unknown): string {
	if (error instanceof TimetablePlanningError) return error.message;
	if (error instanceof Error) return error.message;
	return 'An unexpected error occurred';
}

export async function getTimetableAllocationsByUserId(userId: string) {
	return service.getByUserIdWithRelations(userId);
}

export async function createTimetableAllocationsWithVenueTypes(
	allocations: TimetableAllocation[],
	venueTypeIds: string[],
	allowedVenueIds?: string[]
): Promise<ActionResult<TimetableAllocation[]>> {
	try {
		const data = await service.createManyWithVenueTypes(
			allocations,
			venueTypeIds,
			allowedVenueIds ?? []
		);
		return { success: true, data };
	} catch (error) {
		return { success: false, error: extractErrorMessage(error) };
	}
}

export async function createTimetableAllocationWithVenueTypes(
	allocation: TimetableAllocation,
	venueTypeIds: string[],
	allowedVenueIds?: string[]
): Promise<ActionResult<TimetableAllocation>> {
	try {
		const data = await service.createWithVenueTypes(
			allocation,
			venueTypeIds,
			allowedVenueIds ?? []
		);
		return { success: true, data };
	} catch (error) {
		return { success: false, error: extractErrorMessage(error) };
	}
}

export async function updateTimetableAllocation(
	id: number,
	allocation: Partial<TimetableAllocation>
): Promise<ActionResult<TimetableAllocation>> {
	try {
		const data = await service.update(id, allocation);
		return { success: true, data };
	} catch (error) {
		return { success: false, error: extractErrorMessage(error) };
	}
}

export async function updateTimetableAllocationVenueTypes(
	id: number,
	venueTypeIds: string[]
): Promise<ActionResult<void>> {
	try {
		await service.updateVenueTypes(id, venueTypeIds);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractErrorMessage(error) };
	}
}

export async function updateTimetableAllocationAllowedVenues(
	id: number,
	venueIds: string[]
): Promise<ActionResult<void>> {
	try {
		await service.updateAllowedVenues(id, venueIds);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractErrorMessage(error) };
	}
}

export async function deleteTimetableAllocation(
	id: number
): Promise<ActionResult<void>> {
	try {
		await service.delete(id);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractErrorMessage(error) };
	}
}

export async function deleteTimetableAllocations(
	ids: number[]
): Promise<ActionResult<void>> {
	try {
		await service.deleteMany(ids);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractErrorMessage(error) };
	}
}
