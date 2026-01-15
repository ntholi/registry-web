'use server';

import type { timetableAllocations, timetableSlots } from '@/core/database';
import { timetableSlotService } from './service';

export async function getUserTimetableSlots(userId: string, termId: number) {
	return timetableSlotService.getUserSlots(userId, termId);
}

type AllocationInsert = typeof timetableAllocations.$inferInsert;
type DayOfWeek = (typeof timetableSlots.dayOfWeek.enumValues)[number];

export async function createAllocationsWithSlots(
	items: Array<{
		allocation: AllocationInsert;
		slot: {
			venueId: string;
			dayOfWeek: DayOfWeek;
			startTime: string;
			endTime: string;
		};
	}>
) {
	return timetableSlotService.createAllocationsWithSlots(items);
}
