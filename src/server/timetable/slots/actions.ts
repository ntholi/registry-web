'use server';

import { timetableSlotService } from './service';

export async function allocateTimetableSlot(allocationId: number) {
	return timetableSlotService.allocateSlot(allocationId);
}

export async function getTermSlots(termId: number) {
	return timetableSlotService.listTermSlots(termId);
}
