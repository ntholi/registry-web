'use server';

import type { timetableAllocations } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { timetableAllocationService as service } from './service';

type TimetableAllocation = typeof timetableAllocations.$inferInsert;

export const getTimetableAllocationsByUserId = createAction(
	async (userId: string) => {
		return service.getByUserIdWithRelations(userId);
	}
);

export const createTimetableAllocationsWithVenueTypes = createAction(
	async (
		allocations: TimetableAllocation[],
		venueTypeIds: string[],
		allowedVenueIds?: string[]
	) => {
		return service.createManyWithVenueTypes(
			allocations,
			venueTypeIds,
			allowedVenueIds ?? []
		);
	}
);

export const createTimetableAllocationWithVenueTypes = createAction(
	async (
		allocation: TimetableAllocation,
		venueTypeIds: string[],
		allowedVenueIds?: string[]
	) => {
		return service.createWithVenueTypes(
			allocation,
			venueTypeIds,
			allowedVenueIds ?? []
		);
	}
);

export const updateTimetableAllocation = createAction(
	async (id: number, allocation: Partial<TimetableAllocation>) => {
		return service.update(id, allocation);
	}
);

export const updateTimetableAllocationVenueTypes = createAction(
	async (id: number, venueTypeIds: string[]) => {
		await service.updateVenueTypes(id, venueTypeIds);
	}
);

export const updateTimetableAllocationAllowedVenues = createAction(
	async (id: number, venueIds: string[]) => {
		await service.updateAllowedVenues(id, venueIds);
	}
);

export const deleteTimetableAllocation = createAction(async (id: number) => {
	await service.delete(id);
});

export const deleteTimetableAllocations = createAction(
	async (ids: number[]) => {
		await service.deleteMany(ids);
	}
);

export const setAllocationOverflowVenue = createAction(
	async (allocationId: number, venueId: string) => {
		await service.setOverflowVenue(allocationId, venueId);
	}
);
