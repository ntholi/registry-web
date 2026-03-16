'use server';

import type { timetableAllocations } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { timetableAllocationService as service } from './service';

type TimetableAllocation = typeof timetableAllocations.$inferInsert;

export async function getTimetableAllocationsByUserId(userId: string) {
	return service.getByUserIdWithRelations(userId);
}

export const createTimetableAllocationsWithVenueTypes = createAction(
	async (
		allocations: TimetableAllocation[],
		venueTypeIds: string[],
		allowedVenueIds?: string[]
	) =>
		service.createManyWithVenueTypes(
			allocations,
			venueTypeIds,
			allowedVenueIds ?? []
		)
);

export const createTimetableAllocationWithVenueTypes = createAction(
	async (
		allocation: TimetableAllocation,
		venueTypeIds: string[],
		allowedVenueIds?: string[]
	) =>
		service.createWithVenueTypes(
			allocation,
			venueTypeIds,
			allowedVenueIds ?? []
		)
);

export const updateTimetableAllocation = createAction(
	async (id: number, allocation: Partial<TimetableAllocation>) =>
		service.update(id, allocation)
);

export const updateTimetableAllocationVenueTypes = createAction(
	async (id: number, venueTypeIds: string[]) =>
		service.updateVenueTypes(id, venueTypeIds)
);

export const updateTimetableAllocationAllowedVenues = createAction(
	async (id: number, venueIds: string[]) =>
		service.updateAllowedVenues(id, venueIds)
);

export const deleteTimetableAllocation = createAction(async (id: number) =>
	service.delete(id)
);

export const deleteTimetableAllocations = createAction(async (ids: number[]) =>
	service.deleteMany(ids)
);

export const setAllocationOverflowVenue = createAction(
	async (allocationId: number, venueId: string) =>
		service.setOverflowVenue(allocationId, venueId)
);
