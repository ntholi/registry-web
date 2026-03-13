import withPermission from '@/core/platform/withPermission';
import {
	findSlotsForClass,
	findSlotsForUser,
	findSlotsForVenue,
	getClassesForTerm,
} from './repository';

export async function getVenueTimetable(venueId: string, termId: number) {
	return withPermission(async () => {
		return findSlotsForVenue(venueId, termId);
	}, 'dashboard');
}

export async function getClassTimetable(semesterId: number, termId: number) {
	return withPermission(async () => {
		return findSlotsForClass(semesterId, termId);
	}, 'dashboard');
}

export async function getLecturerTimetable(userId: string, termId: number) {
	return withPermission(async () => {
		return findSlotsForUser(userId, termId);
	}, 'dashboard');
}

export async function getAvailableClasses(termId: number) {
	return withPermission(async () => {
		return getClassesForTerm(termId);
	}, 'dashboard');
}
