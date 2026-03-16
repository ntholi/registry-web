'use server';

import type { timetableAllocations, timetableSlots } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import { timetableSlotService } from './service';

export async function getUserTimetableSlots(userId: string, termId: number) {
	return timetableSlotService.getUserSlots(userId, termId);
}

type AllocationInsert = typeof timetableAllocations.$inferInsert;
type DayOfWeek = (typeof timetableSlots.dayOfWeek.enumValues)[number];

export const createAllocationsWithSlots = createAction(
	async (
		items: Array<{
			allocation: AllocationInsert;
			slot: {
				venueId: string;
				dayOfWeek: DayOfWeek;
				startTime: string;
				endTime: string;
				allowOverflow?: boolean;
			};
		}>
	) => timetableSlotService.createAllocationsWithSlots(items)
);

export const rebuildTermSlots = createAction(async (termId: number) =>
	timetableSlotService.rebuildTermSlots(termId)
);
