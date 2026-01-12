'use server';

import { createNotification } from '@admin/notifications/_server/actions';
import { auth } from '@/core/auth';
import { termSettingsService as service } from './settings-service';

export async function getTermSettings(termId: number) {
	return service.findByTermId(termId);
}

export async function updateResultsPublished(
	termId: number,
	published: boolean
) {
	return service.updateResultsPublished(termId, published);
}

export async function updateResultsPublishedWithNotification(
	termId: number,
	published: boolean,
	termCode: string,
	sendNotification: boolean
) {
	const result = await service.updateResultsPublished(termId, published);

	if (published && sendNotification) {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error('Unauthorized');
		}

		const visibleFrom = new Date();
		const visibleUntil = new Date();
		visibleUntil.setMonth(visibleUntil.getMonth() + 3);

		await createNotification({
			title: 'Results Published',
			message: `Results for term ${termCode} have been published. Click to view your transcript.`,
			link: `/student-portal/transcripts?term=${termCode}`,
			targetType: 'role',
			targetRoles: ['student'],
			visibleFrom,
			visibleUntil,
			isActive: true,
		});
	}

	return result;
}

export async function updateGradebookAccess(termId: number, access: boolean) {
	return service.updateGradebookAccess(termId, access);
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

export async function getUnpublishedTermCodes() {
	return service.getUnpublishedTermCodes();
}
