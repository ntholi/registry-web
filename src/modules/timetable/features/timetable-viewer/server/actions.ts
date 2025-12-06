'use server';

import {
	getAvailableClasses,
	getClassTimetable,
	getLecturerTimetable,
	getVenueTimetable,
} from './service';

export async function getVenueTimetableSlots(venueId: number, termId: number) {
	return getVenueTimetable(venueId, termId);
}

export async function getClassTimetableSlots(
	semesterId: number,
	termId: number
) {
	return getClassTimetable(semesterId, termId);
}

export async function getLecturerTimetableSlots(
	userId: string,
	termId: number
) {
	return getLecturerTimetable(userId, termId);
}

export async function getClassesWithTimetable(termId: number) {
	return getAvailableClasses(termId);
}
