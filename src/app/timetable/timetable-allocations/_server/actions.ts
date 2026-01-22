'use server';

import type { timetableAllocations } from '@/core/database';
import { TimetablePlanningError } from '../../slots/_server/errors';
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
	try {
		return await service.createManyWithVenueTypes(
			allocations,
			venueTypeIds,
			allowedVenueIds ?? []
		);
	} catch (error) {
		if (error instanceof TimetablePlanningError) {
			throw new Error(error.message);
		}
		throw error;
	}
}

export async function createTimetableAllocationWithVenueTypes(
	allocation: TimetableAllocation,
	venueTypeIds: string[],
	allowedVenueIds?: string[]
) {
	try {
		return await service.createWithVenueTypes(
			allocation,
			venueTypeIds,
			allowedVenueIds ?? []
		);
	} catch (error) {
		if (error instanceof TimetablePlanningError) {
			throw new Error(error.message);
		}
		throw error;
	}
}

export async function updateTimetableAllocation(
	id: number,
	allocation: Partial<TimetableAllocation>
) {
	try {
		return await service.update(id, allocation);
	} catch (error) {
		if (error instanceof TimetablePlanningError) {
			throw new Error(error.message);
		}
		throw error;
	}
}

export async function updateTimetableAllocationVenueTypes(
	id: number,
	venueTypeIds: string[]
) {
	try {
		return await service.updateVenueTypes(id, venueTypeIds);
	} catch (error) {
		if (error instanceof TimetablePlanningError) {
			throw new Error(error.message);
		}
		throw error;
	}
}

export async function updateTimetableAllocationAllowedVenues(
	id: number,
	venueIds: string[]
) {
	try {
		return await service.updateAllowedVenues(id, venueIds);
	} catch (error) {
		if (error instanceof TimetablePlanningError) {
			throw new Error(error.message);
		}
		throw error;
	}
}

export async function deleteTimetableAllocation(id: number) {
	try {
		return await service.delete(id);
	} catch (error) {
		if (error instanceof TimetablePlanningError) {
			throw new Error(error.message);
		}
		throw error;
	}
}

export async function deleteTimetableAllocations(ids: number[]) {
	try {
		return await service.deleteMany(ids);
	} catch (error) {
		if (error instanceof TimetablePlanningError) {
			throw new Error(error.message);
		}
		throw error;
	}
}
