'use server';

import { timetableSlotService } from './service';

export async function getUserTimetableSlots(userId: string, termId: number) {
	return timetableSlotService.getUserSlots(userId, termId);
}
