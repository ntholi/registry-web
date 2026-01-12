'use server';

import { termSettingsService as service } from './settings-service';

export async function updateResultsPublished(
	termId: number,
	published: boolean
) {
	return service.updateResultsPublished(termId, published);
}

export async function updateGradebookAccess(
	termId: number,
	access: boolean,
	openDate: string | null,
	closeDate: string | null
) {
	return service.updateGradebookAccess(termId, access, openDate, closeDate);
}

export async function updateRegistrationDates(
	termId: number,
	startDate: string | null,
	endDate: string | null
) {
	return service.updateRegistrationDates(termId, startDate, endDate);
}

export async function moveRejectedToBlocked(termId: number) {
	return service.moveRejectedToBlocked(termId);
}

export async function hasRejectedStudentsForTerm(termId: number) {
	return service.hasRejectedStudentsForTerm(termId);
}
