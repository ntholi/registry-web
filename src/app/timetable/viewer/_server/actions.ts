'use server';

import { createAction } from '@/shared/lib/utils/actionResult';
import {
	getAvailableClasses,
	getClassTimetable,
	getLecturerTimetable,
	getVenueTimetable,
} from './service';

export const getVenueTimetableSlots = createAction(
	async (venueId: string, termId: number) => {
		return getVenueTimetable(venueId, termId);
	}
);

export const getClassTimetableSlots = createAction(
	async (semesterId: number, termId: number) => {
		return getClassTimetable(semesterId, termId);
	}
);

export const getLecturerTimetableSlots = createAction(
	async (userId: string, termId: number) => {
		return getLecturerTimetable(userId, termId);
	}
);

export const getClassesWithTimetable = createAction(async (termId: number) => {
	return getAvailableClasses(termId);
});
