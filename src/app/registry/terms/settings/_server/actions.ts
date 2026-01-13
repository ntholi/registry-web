'use server';

import { createNotification } from '@admin/notifications/_server/actions';
import { auth } from '@/core/auth';
import { termSettingsService as service } from './service';

export async function getTermSettings(termId: number) {
	return service.findByTermId(termId);
}

export async function updateResultsPublished(
	termId: number,
	published: boolean
) {
	return service.updateResultsPublished(termId, published);
}

interface PublishOptions {
	sendNotification: boolean;
	closeGradebook: boolean;
	moveRejectedToBlocked: boolean;
}

export async function updateResultsPublishedWithNotification(
	termId: number,
	published: boolean,
	termCode: string,
	options: PublishOptions
) {
	const result = await service.updateResultsPublished(termId, published);

	if (published) {
		if (options.closeGradebook) {
			await service.updateGradebookAccess(termId, false);
		}

		if (options.moveRejectedToBlocked) {
			await service.moveRejectedToBlocked(termId);
		}

		if (options.sendNotification) {
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

export async function getUnpublishedTermCodes() {
	return service.getUnpublishedTermCodes();
}

const BASE_URL = 'https://pub-2b37ce26bd70421e9e59e4fe805c6873.r2.dev';

function getAttachmentFolder(
	termCode: string,
	type: 'scanned-pdf' | 'raw-marks' | 'other'
) {
	switch (type) {
		case 'scanned-pdf':
			return `documents/${termCode}/publications/scanned`;
		case 'raw-marks':
			return `documents/${termCode}/publications/raw-marks`;
		case 'other':
			return `documents/${termCode}/publications/other`;
	}
}

export async function getPublicationAttachments(termCode: string) {
	const attachments = await service.getPublicationAttachments(termCode);
	return attachments.map((att) => {
		const folder = getAttachmentFolder(termCode, att.type);
		return {
			...att,
			url: `${BASE_URL}/${folder}/${att.fileName}`,
		};
	});
}

export async function savePublicationAttachment(data: {
	termCode: string;
	fileName: string;
	type: 'scanned-pdf' | 'raw-marks' | 'other';
}) {
	return service.createPublicationAttachment(data);
}

export async function deletePublicationAttachment(id: string) {
	return service.deletePublicationAttachment(id);
}

export async function getAttachmentFolderPath(
	termCode: string,
	type: 'scanned-pdf' | 'raw-marks' | 'other'
) {
	return getAttachmentFolder(termCode, type);
}
