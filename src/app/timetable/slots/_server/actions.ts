'use server';

import type { timetableAllocations, timetableSlots } from '@/core/database';
import { TimetablePlanningError } from './errors';
import { timetableSlotService } from './service';

export type ActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

function extractErrorMessage(error: unknown): string {
	if (error instanceof TimetablePlanningError) return error.message;
	if (error instanceof Error) return error.message;
	return 'An unexpected error occurred';
}

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
			allowOverflow?: boolean;
		};
	}>
): Promise<ActionResult<void>> {
	try {
		await timetableSlotService.createAllocationsWithSlots(items);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractErrorMessage(error) };
	}
}

export async function rebuildTermSlots(
	termId: number
): Promise<ActionResult<void>> {
	try {
		await timetableSlotService.rebuildTermSlots(termId);
		return { success: true, data: undefined };
	} catch (error) {
		return { success: false, error: extractErrorMessage(error) };
	}
}
