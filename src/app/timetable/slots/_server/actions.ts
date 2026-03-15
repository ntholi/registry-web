'use server';

import type { timetableAllocations, timetableSlots } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import { timetableSlotService } from './service';

export const getUserTimetableSlots = createAction(
	async (userId: string, termId: number) => {
		return timetableSlotService.getUserSlots(userId, termId);
	}
);

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
	) => {
		await timetableSlotService.createAllocationsWithSlots(items);
	}
);

export const rebuildTermSlots = createAction(async (termId: number) => {
	await timetableSlotService.rebuildTermSlots(termId);
});
