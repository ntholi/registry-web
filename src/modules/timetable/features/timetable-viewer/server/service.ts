import withAuth from '@/core/platform/withAuth';
import {
	findSlotsForClass,
	findSlotsForUser,
	findSlotsForVenue,
	getClassesForTerm,
} from './repository';

export async function getVenueTimetable(venueId: number, termId: number) {
	return withAuth(async () => {
		return findSlotsForVenue(venueId, termId);
	}, ['dashboard']);
}

export async function getClassTimetable(semesterId: number, termId: number) {
	return withAuth(async () => {
		return findSlotsForClass(semesterId, termId);
	}, ['dashboard']);
}

export async function getLecturerTimetable(userId: string, termId: number) {
	return withAuth(async () => {
		return findSlotsForUser(userId, termId);
	}, ['dashboard']);
}

export async function getAvailableClasses(termId: number) {
	return withAuth(async () => {
		return getClassesForTerm(termId);
	}, ['dashboard']);
}
